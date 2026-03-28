"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { validateSurveyData, type SurveyData } from "@/lib/survey-config";
import { triggerGamification } from "@/lib/gamification/trigger";

export async function submitSurvey(data: SurveyData): Promise<ActionResult> {
  return safe(async () => {
    const { valid, errors } = validateSurveyData(data);
    if (!valid) {
      const firstError = Object.values(errors)[0];
      throw new ActionError("invalidInput", firstError ?? "Invalid survey data");
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    await prisma.surveyResponse.create({
      data: {
        conversationStyle: data.conversationStyle,
        features: data.features,
        mustHave: data.mustHave.trim(),
        dealbreaker: data.dealbreaker?.trim() || null,
        otherFeedback: data.otherFeedback?.trim() || null,
        userId,
      },
    });

    if (userId) {
      await triggerGamification(userId, "survey:complete");
    }
  });
}
