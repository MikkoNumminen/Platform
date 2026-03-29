"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID, createStringValidator } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { getSurveyResults } from "./survey-queries";
import type { SurveyResultsData } from "./survey-queries";
import { logAudit } from "./audit";

const validateTitle = createStringValidator(
  "Round title",
  200,
  "roundTitleRequired",
  "roundTitleTooLong",
);

export const createSurveyRound = guardedAction(
  "survey:results",
  "survey:createRound",
  async (session, title: string, description?: string, xpReward?: number) => {
    const validTitle = validateTitle(title);
    const reward = Math.round(Math.max(0, Math.min(xpReward ?? 0, 10000)));

    // Check no other round is active
    const existing = await prisma.surveyRound.findFirst({ where: { status: "active" } });
    if (existing) {
      throw new ActionError(
        "roundAlreadyActive",
        "Close the current active round before creating a new one",
      );
    }

    // Auto-increment round number
    const maxRound = await prisma.surveyRound.aggregate({ _max: { number: true } });
    const nextNumber = (maxRound._max.number ?? 0) + 1;

    const round = await prisma.surveyRound.create({
      data: {
        number: nextNumber,
        title: validTitle,
        description: description?.trim() || null,
        xpReward: reward,
        creatorId: session.user.id,
      },
    });

    // If XP reward > 0, create CustomQuest for all active (non-pending, non-deleted) users
    if (reward > 0) {
      const activeUsers = await prisma.user.findMany({
        where: { role: { not: "pending" }, deletedAt: null, sessionId: null },
        select: { id: true },
      });

      if (activeUsers.length > 0) {
        await prisma.customQuest.createMany({
          data: activeUsers.map((u) => ({
            title: `Complete Survey: ${validTitle}`,
            description: `Complete the "${validTitle}" feedback survey to earn ${reward} XP.`,
            xpReward: reward,
            assigneeId: u.id,
            creatorId: session.user.id,
            surveyRoundId: round.id,
          })),
        });
      }
    }

    await logAudit({
      action: "surveyRound.create",
      entityType: "SurveyRound",
      entityId: round.id,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: validTitle, number: nextNumber, xpReward: reward },
    });

    revalidatePath("/feedback");
    revalidatePath("/my-quests");
    revalidatePath("/admin/quests");
  },
);

export const closeSurveyRound = guardedAction(
  "survey:results",
  "survey:closeRound",
  async (session, roundId: string) => {
    validateUUID(roundId, "roundId");

    const round = await prisma.surveyRound.findFirst({
      where: { id: roundId, status: "active" },
    });
    if (!round) {
      throw new ActionError("roundNotFound", "Active round not found");
    }

    await prisma.surveyRound.update({
      where: { id: roundId },
      data: { status: "closed", closedAt: new Date() },
    });

    await logAudit({
      action: "surveyRound.close",
      entityType: "SurveyRound",
      entityId: roundId,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: round.title, number: round.number },
    });

    revalidatePath("/feedback");
  },
);

export async function fetchRoundResults(roundId: string | null): Promise<SurveyResultsData> {
  return getSurveyResults(roundId);
}
