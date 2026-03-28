import { prisma } from "@/lib/db";
import { getDemoSessionId } from "./demo-session";

export interface SurveyResultsData {
  totalResponses: number;
  conversationStyleCounts: Array<{ label: string; count: number }>;
  featureCounts: Array<{ label: string; count: number }>;
  mustHaveResponses: Array<{ text: string; submittedAt: Date }>;
  dealbreakerResponses: Array<{ text: string; submittedAt: Date }>;
  otherFeedbackResponses: Array<{ text: string; submittedAt: Date }>;
}

export async function getSurveyResults(roundId?: string | null): Promise<SurveyResultsData> {
  const sessionId = await getDemoSessionId();
  const where: Record<string, unknown> = { sessionId };
  if (roundId !== undefined) {
    where.roundId = roundId;
  }
  const responses = await prisma.surveyResponse.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  const conversationStyleMap = new Map<string, number>();
  const featureMap = new Map<string, number>();

  for (const response of responses) {
    const current = conversationStyleMap.get(response.conversationStyle) || 0;
    conversationStyleMap.set(response.conversationStyle, current + 1);

    for (const feature of response.features) {
      const count = featureMap.get(feature) || 0;
      featureMap.set(feature, count + 1);
    }
  }

  const conversationStyleCounts = Array.from(conversationStyleMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const featureCounts = Array.from(featureMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const mustHaveResponses = responses.map((r) => ({
    text: r.mustHave,
    submittedAt: r.submittedAt,
  }));

  const dealbreakerResponses = responses
    .filter((r) => r.dealbreaker)
    .map((r) => ({ text: r.dealbreaker!, submittedAt: r.submittedAt }));

  const otherFeedbackResponses = responses
    .filter((r) => r.otherFeedback)
    .map((r) => ({ text: r.otherFeedback!, submittedAt: r.submittedAt }));

  return {
    totalResponses: responses.length,
    conversationStyleCounts,
    featureCounts,
    mustHaveResponses,
    dealbreakerResponses,
    otherFeedbackResponses,
  };
}
