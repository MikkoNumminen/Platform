"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { DM_TESTING_QUESTIONS } from "@/lib/custom-survey-config";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

/**
 * Creates the DM testing survey round + individual quests for all active users.
 * Superuser-only, one-time action.
 */
export async function seedDmTestingRound(): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }
    if (session.user.role !== "superuser") {
      throw new ActionError("permissionDenied", "Superuser only");
    }

    const creatorId = session.user.id;
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

    // Auto-increment round number
    const maxRound = await prisma.surveyRound.aggregate({ _max: { number: true } });
    const nextNumber = (maxRound._max.number ?? 0) + 1;

    // Create the survey round with custom questions
    const round = await prisma.surveyRound.create({
      data: {
        number: nextNumber,
        title: "Private Messaging Feedback",
        description:
          "Help us improve the messaging system! Complete the DM testing tasks and share your feedback.",
        xpReward: 20,
        customQuestions: DM_TESTING_QUESTIONS as unknown as Prisma.InputJsonValue,
        deadline,
        creatorId,
      },
    });

    // Get all active (non-pending, non-deleted, non-demo) users
    const activeUsers = await prisma.user.findMany({
      where: { role: { not: "pending" }, deletedAt: null, sessionId: null },
      select: { id: true },
    });

    // Create the survey completion quest for all users
    if (activeUsers.length > 0) {
      await prisma.quest.createMany({
        data: activeUsers.map((u) => ({
          name: "Complete Survey: Private Messaging Feedback",
          description:
            "Complete the DM feedback survey to share your thoughts on the messaging system.",
          xpReward: 20,
          type: "campaign",
          assigneeId: u.id,
          creatorId,
          surveyRoundId: round.id,
          deadline,
        })),
      });
    }

    // Create individual DM testing quests
    const dmQuests = [
      {
        name: "Send your first private message",
        description: "Open a conversation with any community member and send them a message.",
        xpReward: 15,
      },
      {
        name: "Start a conversation with someone new",
        description:
          "Use the new message button to start a DM with a member you haven't messaged before.",
        xpReward: 15,
      },
      {
        name: "Use the /w whisper command",
        description:
          "Type /w <username> <message> in the shoutbox to send a whisper (private message).",
        xpReward: 15,
      },
    ];

    for (const quest of dmQuests) {
      await prisma.quest.createMany({
        data: activeUsers.map((u) => ({
          name: quest.name,
          description: quest.description,
          xpReward: quest.xpReward,
          type: "assigned",
          priority: "high",
          assigneeId: u.id,
          creatorId,
          deadline,
        })),
      });
    }

    await logAudit({
      action: "surveyRound.seedDmTesting",
      entityType: "SurveyRound",
      entityId: round.id,
      actorId: creatorId,
      actorName: session.user.alias ?? session.user.name,
      details: {
        roundNumber: nextNumber,
        userCount: activeUsers.length,
        questTypes: ["survey", ...dmQuests.map((q) => q.name)],
      },
    });
  });
}
