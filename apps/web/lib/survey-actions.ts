"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { validateSurveyData, type SurveyData } from "@/lib/survey-config";
import { triggerGamification } from "@/lib/gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";
import { awardCustomXp } from "@/lib/gamification/xp-service";

export async function submitSurvey(data: SurveyData, roundId?: string): Promise<ActionResult> {
  return safe(async () => {
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

      if (roundId) {
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
    }
  });
}
