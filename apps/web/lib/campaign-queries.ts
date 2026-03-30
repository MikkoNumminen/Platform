"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getDemoSessionId } from "@/lib/demo-session";

export interface CampaignQuest {
  id: string;
  title: string;
  xpReward: number;
  status: string;
  completedAt: string | null;
}

export interface ActiveCampaign {
  roundId: string;
  roundTitle: string;
  roundDescription: string | null;
  deadline: string | null;
  customQuestions: unknown[] | null;
  quests: CampaignQuest[];
}

export async function getActiveCampaign(): Promise<ActiveCampaign | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const sessionId = await getDemoSessionId();

  // Find the active survey round with a deadline (campaign rounds)
  const round = await prisma.surveyRound.findFirst({
    where: {
      status: "active",
      deadline: { not: null },
    },
    select: {
      id: true,
      title: true,
      description: true,
      deadline: true,
      customQuestions: true,
    },
  });

  if (!round) return null;

  // Get user's quests for this campaign (both survey-linked and deadline-matched)
  const quests = await prisma.customQuest.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      OR: [
        { surveyRoundId: round.id },
        {
          deadline: round.deadline,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      ],
      ...(sessionId ? {} : { assignee: { sessionId: null } }),
    },
    select: {
      id: true,
      title: true,
      xpReward: true,
      status: true,
      completedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (quests.length === 0) return null;

  return {
    roundId: round.id,
    roundTitle: round.title,
    roundDescription: round.description,
    deadline: round.deadline?.toISOString() ?? null,
    customQuestions: round.customQuestions as unknown[] | null,
    quests: quests.map((q) => ({
      id: q.id,
      title: q.title,
      xpReward: q.xpReward,
      status: q.status,
      completedAt: q.completedAt?.toISOString() ?? null,
    })),
  };
}
