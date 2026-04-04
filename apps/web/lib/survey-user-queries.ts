import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";

export async function getUserSurveyStatus(userIds: string[]): Promise<Record<string, boolean>> {
  if (userIds.length === 0) return {};

  const { tenant, sessionId } = await getTenantFilter();

  const responses = await prisma.surveyResponse.findMany({
    where: { userId: { in: userIds }, tenant, sessionId },
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
