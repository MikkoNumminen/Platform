import { prisma } from "@/lib/db";

export async function getUserSurveyStatus(userIds: string[]): Promise<Record<string, boolean>> {
  if (userIds.length === 0) return {};

  const responses = await prisma.surveyResponse.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const completedSet = new Set(responses.map((r) => r.userId));
  const result: Record<string, boolean> = {};

  for (const id of userIds) {
    result[id] = completedSet.has(id);
  }

  return result;
}
