import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDemoSessionId } from "./demo-session";

const CustomQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(["single", "multi", "text"]),
  options: z.array(z.string()).optional(),
});

const CustomQuestionsSchema = z.array(CustomQuestionSchema);

const CustomAnswersSchema = z.record(z.string(), z.unknown());

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

  // Use count() instead of loading all rows just to get the total
  const totalResponses = await prisma.surveyResponse.count({ where });

  // Use groupBy for conversation style — avoids loading all rows into memory
  const conversationStyleGroups = await prisma.surveyResponse.groupBy({
    by: ["conversationStyle"],
    where,
    _count: { conversationStyle: true },
  });
  const conversationStyleMap: Record<string, number> = {};
  for (const g of conversationStyleGroups) {
    if (g.conversationStyle) {
      conversationStyleMap[g.conversationStyle] = g._count.conversationStyle;
    }
  }
  const conversationStyleCounts = Object.entries(conversationStyleMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // features is a String[] — groupBy can't expand arrays, so aggregate in memory
  // but load only the features column to minimise data transfer
  const featureResponses = await prisma.surveyResponse.findMany({
    where,
    select: { features: true },
  });
  const featureMap = new Map<string, number>();
  for (const r of featureResponses) {
    for (const feature of r.features) {
      featureMap.set(feature, (featureMap.get(feature) ?? 0) + 1);
    }
  }
  const featureCounts = Array.from(featureMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Load only the columns needed for mustHave text responses
  const mustHaveRows = await prisma.surveyResponse.findMany({
    where,
    select: { mustHave: true, submittedAt: true },
    orderBy: { submittedAt: "desc" },
  });
  const mustHaveResponses = mustHaveRows.map((r) => ({
    text: r.mustHave,
    submittedAt: r.submittedAt,
  }));

  // Load only the columns needed for dealbreaker and otherFeedback text responses
  const textRows = await prisma.surveyResponse.findMany({
    where,
    select: { dealbreaker: true, otherFeedback: true, submittedAt: true },
    orderBy: { submittedAt: "desc" },
  });
  const dealbreakerResponses = textRows
    .filter((r) => r.dealbreaker)
    .map((r) => ({ text: r.dealbreaker!, submittedAt: r.submittedAt }));
  const otherFeedbackResponses = textRows
    .filter((r) => r.otherFeedback)
    .map((r) => ({ text: r.otherFeedback!, submittedAt: r.submittedAt }));

  // Aggregate custom answers if this is a round with custom questions
  let customResults: CustomResultItem[] | undefined;
  if (roundId) {
    const round = await prisma.surveyRound.findUnique({
      where: { id: roundId },
      select: { customQuestions: true },
    });
    const parsedQuestions = CustomQuestionsSchema.safeParse(round?.customQuestions);
    const questions = parsedQuestions.success ? parsedQuestions.data : null;

    if (questions && questions.length > 0) {
      // Load only customAnswers and submittedAt for custom question aggregation
      const customRows = await prisma.surveyResponse.findMany({
        where,
        select: { customAnswers: true, submittedAt: true },
      });

      customResults = questions.map((q) => {
        if (q.type === "text") {
          const textResponses: Array<{ text: string; submittedAt: Date }> = [];
          for (const r of customRows) {
            const parsedAnswers = CustomAnswersSchema.safeParse(r.customAnswers);
            const ca = parsedAnswers.success ? parsedAnswers.data : null;
            const val = ca?.[q.id];
            if (typeof val === "string" && val.trim()) {
              textResponses.push({ text: val, submittedAt: r.submittedAt });
            }
          }
          return { questionId: q.id, questionText: q.text, type: q.type, textResponses };
        }

        // single or multi — aggregate counts
        const countMap = new Map<string, number>();
        for (const r of customRows) {
          const parsedAnswers = CustomAnswersSchema.safeParse(r.customAnswers);
          const ca = parsedAnswers.success ? parsedAnswers.data : null;
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
    totalResponses,
    conversationStyleCounts,
    featureCounts,
    mustHaveResponses,
    dealbreakerResponses,
    otherFeedbackResponses,
    customResults,
  };
}
