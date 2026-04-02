"use server";

import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";
import { LEVEL_THRESHOLDS } from "./xp-config";

export async function getGamificationStats() {
  try {
    return await fetchGamificationStats();
  } catch (error) {
    console.error("[gamification] Stats query failed (tables may not exist yet):", error);
    return {
      summary: { totalUsersWithXp: 0, totalXpAwarded: 0, averageXp: 0, highestXp: 0 },
      levelDistribution: LEVEL_THRESHOLDS.map((lt) => ({
        level: lt.level,
        title: lt.title,
        count: 0,
      })),
      topAchievements: [],
      questCompletionRates: [],
      customQuestStats: { total: 0, completed: 0, inProgress: 0, open: 0, quests: [] },
      recentActivity: [],
    };
  }
}

async function fetchGamificationStats() {
  const sessionId = await getDemoSessionId();
  const [
    totalUsersWithXp,
    xpAggregates,
    levelDistribution,
    topAchievementsRaw,
    questsWithCounts,
    customQuests,
    recentActivity,
  ] = await Promise.all([
    prisma.userLevel.count({
      where: { sessionId },
    }),

    prisma.userLevel.aggregate({
      where: { sessionId },
      _sum: { totalXp: true },
      _avg: { totalXp: true },
      _max: { totalXp: true },
    }),

    prisma.userLevel.groupBy({
      by: ["level"],
      where: { sessionId },
      _count: { level: true },
      orderBy: { level: "asc" },
    }),

    prisma.userAchievement.groupBy({
      by: ["achievementId"],
      where: { sessionId },
      _count: { achievementId: true },
      orderBy: { _count: { achievementId: "desc" } },
      take: 10,
    }),

    prisma.quest.findMany({
      include: {
        _count: {
          select: {
            userProgress: {
              where: { completed: true, sessionId },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),

    prisma.customQuest.findMany({
      where: { deletedAt: null, sessionId },
      select: {
        id: true,
        title: true,
        xpReward: true,
        status: true,
        priority: true,
        assignee: { select: { alias: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.xpTransaction.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: { alias: true, name: true },
        },
      },
    }),
  ]);

  // Resolve achievement names
  const achievementIds = topAchievementsRaw.map((g) => g.achievementId);
  const achievements =
    achievementIds.length > 0
      ? await prisma.achievement.findMany({ where: { id: { in: achievementIds } } })
      : [];
  const achievementMap = new Map(achievements.map((a) => [a.id, a]));

  const topAchievements = topAchievementsRaw
    .map((g) => ({
      achievement: achievementMap.get(g.achievementId),
      count: g._count.achievementId,
    }))
    .filter((ta) => ta.achievement != null) as Array<{
    achievement: (typeof achievements)[0];
    count: number;
  }>;

  const questCompletionRates = questsWithCounts.map((q) => ({
    name: q.name,
    icon: q.icon,
    type: q.type,
    description: q.description,
    xpReward: q.xpReward,
    completedCount: q._count.userProgress,
    totalUsers: totalUsersWithXp || 1,
    completionRate:
      totalUsersWithXp > 0 ? Math.round((q._count.userProgress / totalUsersWithXp) * 100) : 0,
  }));

  return {
    summary: {
      totalUsersWithXp,
      totalXpAwarded: xpAggregates._sum.totalXp ?? 0,
      averageXp: Math.round(xpAggregates._avg.totalXp ?? 0),
      highestXp: xpAggregates._max.totalXp ?? 0,
    },
    levelDistribution: LEVEL_THRESHOLDS.map((lt) => ({
      level: lt.level,
      title: lt.title,
      count: levelDistribution.find((d) => d.level === lt.level)?._count.level ?? 0,
    })),
    topAchievements,
    questCompletionRates,
    customQuestStats: {
      total: customQuests.length,
      completed: customQuests.filter((q) => q.status === "completed").length,
      inProgress: customQuests.filter((q) => q.status === "in_progress").length,
      open: customQuests.filter((q) => q.status === "open").length,
      quests: customQuests.map((q) => ({
        id: q.id,
        title: q.title,
        xpReward: q.xpReward,
        status: q.status,
        priority: q.priority,
        assignee: q.assignee.alias ?? q.assignee.name ?? "Unknown",
      })),
    },
    recentActivity: recentActivity.map((t) => ({
      user: t.user.alias ?? t.user.name ?? "Anonymous",
      amount: t.amount,
      source: t.source,
      createdAt: t.createdAt,
    })),
  };
}
