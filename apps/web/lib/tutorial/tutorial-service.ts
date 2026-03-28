"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getStepsForRole, TIER_XP_BONUS } from "./tutorial-config";

export async function completeTourStep(stepId: string): Promise<{
  completed: boolean;
  tierCompleted: number | null;
  tierBonus: number;
}> {
  const session = await auth();
  if (!session?.user?.id) return { completed: false, tierCompleted: null, tierBonus: 0 };

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "pending";
  const steps = getStepsForRole(role);

  // Verify step is valid for this role
  const step = steps.find((s) => s.id === stepId);
  if (!step) return { completed: false, tierCompleted: null, tierBonus: 0 };

  // Check if already completed
  const existing = await prisma.userTourProgress.findUnique({
    where: { userId_stepId: { userId, stepId } },
  });
  if (existing) return { completed: false, tierCompleted: null, tierBonus: 0 };

  // Mark complete
  await prisma.userTourProgress.create({
    data: { userId, stepId },
  });

  // Award step XP
  if (step.xpReward > 0) {
    try {
      const { triggerGamification } = await import("@/lib/gamification/trigger");
      await triggerGamification(userId, "quest:complete", stepId);
      // Manually award XP since quest:complete is 0 in config
      const { prisma: db } = await import("@/lib/db");
      await db.xpTransaction.create({
        data: { userId, amount: step.xpReward, source: "tour:step", sourceId: stepId },
      });
      await db.userLevel.upsert({
        where: { userId },
        create: { userId, totalXp: step.xpReward, level: 1 },
        update: { totalXp: { increment: step.xpReward } },
      });
    } catch (error) {
      console.error("[tutorial] XP award error:", error);
    }
  }

  // Check if a tier was just completed
  const allProgress = await prisma.userTourProgress.findMany({
    where: { userId },
    select: { stepId: true },
  });
  const completedIds = new Set(allProgress.map((p) => p.stepId));

  let tierCompleted: number | null = null;
  let tierBonus = 0;

  // Check each tier for completion
  for (const tier of [1, 2, 3, 4]) {
    const tierSteps = steps.filter((s) => s.tier === tier);
    if (tierSteps.length === 0) continue;
    const allTierDone = tierSteps.every((s) => completedIds.has(s.id));
    if (!allTierDone) continue;

    // Check if this tier was JUST completed (the current step was the last one)
    if (step.tier === tier || tierSteps.some((s) => s.id === stepId)) {
      // It's newly completed only if removing our step would make it incomplete
      // Since we already added our step to completedIds via the create above,
      // we just check: was this step the missing piece?
      const previouslyCompleted = tierSteps
        .filter((s) => s.id !== stepId)
        .every((s) => completedIds.has(s.id));
      if (previouslyCompleted && tierSteps.some((s) => s.id === stepId)) {
        tierCompleted = tier;
        tierBonus = TIER_XP_BONUS[tier] ?? 0;

        // Award tier bonus XP
        if (tierBonus > 0) {
          try {
            const { prisma: db } = await import("@/lib/db");
            await db.xpTransaction.create({
              data: { userId, amount: tierBonus, source: "tour:tier", sourceId: `tier_${tier}` },
            });
            await db.userLevel.upsert({
              where: { userId },
              create: { userId, totalXp: tierBonus, level: 1 },
              update: { totalXp: { increment: tierBonus } },
            });
          } catch (error) {
            console.error("[tutorial] Tier bonus error:", error);
          }
        }
        break; // Only celebrate one tier at a time
      }
    }
  }

  return { completed: true, tierCompleted, tierBonus };
}

export async function getTourProgress(userId: string): Promise<string[]> {
  const progress = await prisma.userTourProgress.findMany({
    where: { userId },
    select: { stepId: true },
  });
  return progress.map((p) => p.stepId);
}

export async function resetTour(userId: string): Promise<void> {
  await prisma.userTourProgress.deleteMany({ where: { userId } });
}

export async function getMyTourProgress(): Promise<{
  completedSteps: string[];
  role: string;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = (session.user as { role?: string }).role ?? "pending";

  // Sync progress with actual user data (backfill steps done before tutorial existed)
  try {
    await syncTourProgress(session.user.id);
  } catch (error) {
    console.error("[tutorial] Sync progress error:", error);
  }

  const completedSteps = await getTourProgress(session.user.id);
  return { completedSteps, role };
}

/**
 * Checks user's actual data and auto-completes tutorial steps they've already done.
 * This handles the case where users completed actions before the tutorial system existed.
 */
async function syncTourProgress(userId: string): Promise<void> {
  const existing = await prisma.userTourProgress.findMany({
    where: { userId },
    select: { stepId: true },
  });
  const completedIds = new Set(existing.map((p) => p.stepId));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { alias: true },
  });

  const stepChecks: Array<{ stepId: string; check: () => Promise<boolean> }> = [
    {
      stepId: "set_alias",
      check: async () => !!user?.alias,
    },
    {
      stepId: "complete_survey",
      check: async () => {
        const count = await prisma.surveyResponse.count({ where: { userId } });
        return count > 0;
      },
    },
    {
      stepId: "report_issue",
      check: async () => {
        const count = await prisma.issueReport.count({ where: { authorId: userId } });
        return count > 0;
      },
    },
    {
      stepId: "create_post",
      check: async () => {
        const count = await prisma.post.count({ where: { authorId: userId } });
        return count > 0;
      },
    },
    {
      stepId: "write_comment",
      check: async () => {
        const count = await prisma.thread.count({ where: { authorId: userId } });
        return count > 0;
      },
    },
  ];

  const toComplete: string[] = [];

  for (const { stepId, check } of stepChecks) {
    if (completedIds.has(stepId)) continue;
    try {
      if (await check()) {
        toComplete.push(stepId);
      }
    } catch {
      // Table may not exist yet — skip silently
    }
  }

  if (toComplete.length > 0) {
    await prisma.userTourProgress.createMany({
      data: toComplete.map((stepId) => ({ userId, stepId })),
      skipDuplicates: true,
    });
  }
}
