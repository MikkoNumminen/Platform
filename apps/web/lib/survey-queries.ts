import { prisma } from "@/lib/db";
import { getDemoSessionId } from "./demo-session";

export interface CustomResultItem {
  questionId: string;
  questionText: string;
  type: "single" | "multi" | "text";
  counts?: Array<{ label: string; count: number }>;
  textResponses?: Array<{ text: string; submittedAt: Date }>;
}

export interface SurveyResultsData {
  totalResponses: number;
  conversationStyleCounts: Array<{ label: string; count: number }>;
  featureCounts: Array<{ label: string; count: number }>;
  mustHaveResponses: Array<{ text: string; submittedAt: Date }>;
  dealbreakerResponses: Array<{ text: string; submittedAt: Date }>;
  otherFeedbackResponses: Array<{ text: string; submittedAt: Date }>;
  customResults?: CustomResultItem[];
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

  // Aggregate custom answers if this is a round with custom questions
  let customResults: CustomResultItem[] | undefined;
  if (roundId) {
    const round = await prisma.surveyRound.findUnique({
      where: { id: roundId },
      select: { customQuestions: true },
    });
    const questions = round?.customQuestions as Array<{
      id: string;
      text: string;
      type: "single" | "multi" | "text";
    }> | null;

    if (questions && questions.length > 0) {
      customResults = questions.map((q) => {
        if (q.type === "text") {
          const textResponses: Array<{ text: string; submittedAt: Date }> = [];
          for (const r of responses) {
            const ca = r.customAnswers as Record<string, unknown> | null;
            const val = ca?.[q.id];
            if (typeof val === "string" && val.trim()) {
              textResponses.push({ text: val, submittedAt: r.submittedAt });
            }
          }
          return { questionId: q.id, questionText: q.text, type: q.type, textResponses };
        }

        // single or multi — aggregate counts
        const countMap = new Map<string, number>();
        for (const r of responses) {
          const ca = r.customAnswers as Record<string, unknown> | null;
          const val = ca?.[q.id];
          const values = Array.isArray(val) ? val : typeof val === "string" && val ? [val] : [];
          for (const v of values) {
            countMap.set(String(v), (countMap.get(String(v)) ?? 0) + 1);
          }
        }
        const counts = Array.from(countMap.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count);
        return { questionId: q.id, questionText: q.text, type: q.type, counts };
      });
    }
  }

  return {
    totalResponses: responses.length,
    conversationStyleCounts,
    featureCounts,
    mustHaveResponses,
    dealbreakerResponses,
    otherFeedbackResponses,
    customResults,
  };
}
