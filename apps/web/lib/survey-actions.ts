"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { validateSurveyData, type SurveyData } from "@/lib/survey-config";

export async function submitSurvey(
  data: SurveyData,
): Promise<{ success: boolean; error?: string }> {
  const { valid, errors } = validateSurveyData(data);

  if (!valid) {
    const firstError = Object.values(errors)[0];
    return { success: false, error: firstError };
  }

  try {
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

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
