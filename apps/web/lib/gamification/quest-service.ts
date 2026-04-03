"use server";

import { prisma } from "@/lib/db";
import { QuestCriteriaSchema } from "@/lib/gamification/schemas";

export async function updateQuestProgress(
  userId: string,
  action: string,
): Promise<
  Array<{
    questKey: string;
    completed: boolean;
    progress: number;
    target: number;
    xpAwarded: number;
  }>
> {
  const quests = await prisma.quest.findMany();
  const results: Array<{
    questKey: string;
    completed: boolean;
    progress: number;
    target: number;
    xpAwarded: number;
  }> = [];

  const allProgress = await prisma.userQuestProgress.findMany({
    where: { userId },
  });
  const progressMap = new Map(allProgress.map((p) => [p.questId, p]));

  for (const quest of quests) {
    const parsed = QuestCriteriaSchema.safeParse(quest.criteria);
    if (!parsed.success) continue;
    const criteria = parsed.data;
    if (criteria.action !== action) continue;
    const existing = progressMap.get(quest.id);
    if (existing?.completed && !quest.repeatable) continue;
    if (existing?.completed && quest.repeatable) {
      if (!existing.resetAt || existing.completedAt! > existing.resetAt) continue;
    }
    const currentProgress = existing?.completed ? 0 : (existing?.progress ?? 0);
    const newProgress = currentProgress + 1;
    const isComplete = newProgress >= criteria.count;
    await prisma.userQuestProgress.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      create: {
        userId,
        questId: quest.id,
        progress: newProgress,
        completed: isComplete,
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        progress: newProgress,
        completed: isComplete,
        completedAt: isComplete ? new Date() : undefined,
      },
    });
    let xpAwarded = 0;
    if (isComplete && quest.xpReward > 0) {
      await prisma.xpTransaction.create({
        data: { userId, amount: quest.xpReward, source: "quest:complete", sourceId: quest.id },
      });
      await prisma.userLevel.upsert({
        where: { userId },
        create: { userId, totalXp: quest.xpReward, level: 1 },
        update: { totalXp: { increment: quest.xpReward } },
      });
      xpAwarded = quest.xpReward;
    }
    results.push({
      questKey: quest.key,
      completed: isComplete,
      progress: newProgress,
      target: criteria.count,
      xpAwarded,
    });
  }
  return results;
}

export async function getActiveQuests(userId: string): Promise<
  Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    icon: string | null;
    type: string;
    xpReward: number;
    repeatable: boolean;
    progress: number;
    target: number;
    completed: boolean;
    completedAt: Date | null | undefined;
  }>
> {
  try {
    const quests = await prisma.quest.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    });
    const progress = await prisma.userQuestProgress.findMany({ where: { userId } });
    const progressMap = new Map(progress.map((p) => [p.questId, p]));
    return quests.flatMap((quest) => {
      const p = progressMap.get(quest.id);
      const parsedCriteria = QuestCriteriaSchema.safeParse(quest.criteria);
      if (!parsedCriteria.success) return [];
      const criteria = parsedCriteria.data;
      let isComplete = p?.completed ?? false;
      if (quest.repeatable && p?.resetAt && p?.completedAt && p.completedAt < p.resetAt)
        isComplete = false;
      return {
        id: quest.id,
        key: quest.key,
        name: quest.name,
        description: quest.description,
        icon: quest.icon,
        type: quest.type,
        xpReward: quest.xpReward,
        repeatable: quest.repeatable,
        progress: isComplete ? criteria.count : (p?.progress ?? 0),
        target: criteria.count,
        completed: isComplete,
        completedAt: isComplete ? p?.completedAt : null,
      };
    });
  } catch (error) {
    console.error("[quests] getActiveQuests failed:", error);
    return [];
  }
}

export async function resetDailyQuests(): Promise<number> {
  const result = await prisma.userQuestProgress.updateMany({
    where: { quest: { type: "daily", repeatable: true }, completed: true },
    data: { progress: 0, completed: false, resetAt: new Date() },
  });
  return result.count;
}

export async function resetWeeklyQuests(): Promise<number> {
  const result = await prisma.userQuestProgress.updateMany({
    where: { quest: { type: "weekly", repeatable: true }, completed: true },
    data: { progress: 0, completed: false, resetAt: new Date() },
  });
  return result.count;
}
