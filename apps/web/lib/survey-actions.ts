"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, requireUser, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { validateSurveyData, type SurveyData } from "@/lib/survey-config";
import type { CustomAnswers } from "@/lib/custom-survey-config";
import type { Prisma } from "@prisma/client";
import { triggerGamification } from "@/lib/gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";
import { awardCustomXp } from "@/lib/gamification/xp-service";

async function completeSurveyQuest(userId: string, roundId: string): Promise<void> {
  const quest = await prisma.customQuest.findFirst({
    where: {
      surveyRoundId: roundId,
      assigneeId: userId,
      status: { not: "completed" },
      deletedAt: null,
    },
  });
  if (quest) {
    await prisma.customQuest.update({
      where: { id: quest.id },
      data: { status: "completed", completedAt: new Date() },
    });
    if (quest.xpReward > 0) {
      await awardCustomXp(userId, quest.xpReward, "custom_quest:complete", quest.id);
    }
  }
}

export async function submitSurvey(data: SurveyData, roundId?: string): Promise<ActionResult> {
  return safe(async () => {
    await rateLimit("survey:submit");

    const { valid, errors } = validateSurveyData(data);
    if (!valid) {
      const firstError = Object.values(errors)[0];
      throw new ActionError("invalidInput", firstError ?? "Invalid survey data");
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const sessionId = await getDemoSessionId();

    await prisma.surveyResponse.create({
      data: {
        conversationStyle: data.conversationStyle,
        features: data.features,
        mustHave: data.mustHave.trim(),
        dealbreaker: data.dealbreaker?.trim() || null,
        otherFeedback: data.otherFeedback?.trim() || null,
        wantsToDevelop: (data.developmentSkills ?? []).length > 0,
        developmentSkills: data.developmentSkills ?? [],
        userId,
        roundId: roundId ?? null,
        sessionId,
      },
    });

    if (userId) {
      const skills = data.developmentSkills ?? [];
      await prisma.user.update({
        where: { id: userId },
        data: {
          wantsToDevelop: skills.length > 0,
          developmentSkills: skills,
        },
      });
      await triggerGamification(userId, "survey:complete");
      if (roundId) await completeSurveyQuest(userId, roundId);
    }
  });
}

export async function submitCustomSurvey(
  answers: CustomAnswers,
  roundId: string,
): Promise<ActionResult> {
  return safe(async () => {
    const authUser = await requireUser();
    await rateLimit("survey:submit");

    if (!roundId) {
      throw new ActionError("invalidInput", "Round ID is required");
    }

    const userId = authUser.id;
    const sessionId = await getDemoSessionId();

    await prisma.surveyResponse.create({
      data: {
        conversationStyle: "custom",
        features: [],
        mustHave: "custom",
        customAnswers: answers as unknown as Prisma.InputJsonValue,
        userId,
        roundId,
        sessionId,
      },
    });

    if (userId) {
      await triggerGamification(userId, "survey:complete");
      await completeSurveyQuest(userId, roundId);
    }
  });
}
