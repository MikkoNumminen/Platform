"use server";

import { prisma } from "@/lib/db";
import { awardXp as _awardXp } from "./xp-service";

interface QuestUpdateResult {
  questKey: string;
  completed: boolean;
  progress: number;
  target: number;
  xpAwarded: number;
}

export async function updateQuestProgress(
  userId: string,
  action: string,
): Promise<QuestUpdateResult[]> {
  // Find quests that match this action
  const quests = await prisma.quest.findMany();
  const results: QuestUpdateResult[] = [];

  for (const quest of quests) {
    const criteria = quest.criteria as { action: string; count: number };
    if (criteria.action !== action) continue;

    // Get or create progress
    const existing = await prisma.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId: quest.id } },
    });

    // Skip if completed and not repeatable
    if (existing?.completed && !quest.repeatable) continue;

    // For repeatable quests, check if it's been reset
    if (existing?.completed && quest.repeatable) {
      // If resetAt is null or completed after reset, skip
      if (!existing.resetAt || existing.completedAt! > existing.resetAt) continue;
    }

    const currentProgress = existing?.completed ? 0 : (existing?.progress ?? 0);
    const newProgress = currentProgress + 1;
    const isComplete = newProgress >= criteria.count;

    await prisma.userQuestProgress.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      create: {
        userId,
        questId: quest.id,
        progress: newProgress,
        completed: isComplete,
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        progress: newProgress,
        completed: isComplete,
        completedAt: isComplete ? new Date() : undefined,
      },
    });

    let xpAwarded = 0;
    if (isComplete && quest.xpReward > 0) {
      // Award quest XP via a direct transaction
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: quest.xpReward,
          source: "quest:complete",
          sourceId: quest.id,
        },
      });
      await prisma.userLevel.upsert({
        where: { userId },
        create: { userId, totalXp: quest.xpReward, level: 1 },
        update: { totalXp: { increment: quest.xpReward } },
      });
      xpAwarded = quest.xpReward;
    }

    results.push({
      questKey: quest.key,
      completed: isComplete,
      progress: newProgress,
      target: criteria.count,
      xpAwarded,
    });
  }

  return results;
}

export async function getActiveQuests(userId: string) {
  const quests = await prisma.quest.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  const progress = await prisma.userQuestProgress.findMany({
    where: { userId },
  });

  const progressMap = new Map(progress.map((p) => [p.questId, p]));

  return quests.map((quest) => {
    const p = progressMap.get(quest.id);
    const criteria = quest.criteria as { action: string; count: number };

    // For repeatable quests: show as incomplete if reset
    let isComplete = p?.completed ?? false;
    if (quest.repeatable && p?.resetAt && p?.completedAt && p.completedAt < p.resetAt) {
      isComplete = false;
    }

    return {
      id: quest.id,
      key: quest.key,
      name: quest.name,
      description: quest.description,
      icon: quest.icon,
      type: quest.type,
      xpReward: quest.xpReward,
      repeatable: quest.repeatable,
      progress: isComplete ? criteria.count : (p?.progress ?? 0),
      target: criteria.count,
      completed: isComplete,
      completedAt: isComplete ? p?.completedAt : null,
    };
  });
}

export async function resetDailyQuests(): Promise<number> {
  const result = await prisma.userQuestProgress.updateMany({
    where: {
      quest: { type: "daily", repeatable: true },
      completed: true,
    },
    data: {
      progress: 0,
      completed: false,
      resetAt: new Date(),
    },
  });
  return result.count;
}

export async function resetWeeklyQuests(): Promise<number> {
  const result = await prisma.userQuestProgress.updateMany({
    where: {
      quest: { type: "weekly", repeatable: true },
      completed: true,
    },
    data: {
      progress: 0,
      completed: false,
      resetAt: new Date(),
    },
  });
  return result.count;
}
