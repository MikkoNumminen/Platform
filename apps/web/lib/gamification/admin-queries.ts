"use server";

import { prisma } from "@/lib/db";
import { LEVEL_THRESHOLDS } from "./xp-config";

export async function getGamificationStats() {
  const [
    totalUsersWithXp,
    xpAggregates,
    levelDistribution,
    topAchievementsRaw,
    questsWithCounts,
    recentActivity,
  ] = await Promise.all([
    prisma.userLevel.count(),

    prisma.userLevel.aggregate({
      _sum: { totalXp: true },
      _avg: { totalXp: true },
      _max: { totalXp: true },
    }),

    prisma.userLevel.groupBy({
      by: ["level"],
      _count: { level: true },
      orderBy: { level: "asc" },
    }),

    prisma.userAchievement.groupBy({
      by: ["achievementId"],
      _count: { achievementId: true },
      orderBy: { _count: { achievementId: "desc" } },
      take: 10,
    }),

    prisma.quest.findMany({
      include: {
        _count: {
          select: {
            userProgress: {
              where: { completed: true },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),

    prisma.xpTransaction.findMany({
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
    recentActivity: recentActivity.map((t) => ({
      user: t.user.alias ?? t.user.name ?? "Anonymous",
      amount: t.amount,
      source: t.source,
      createdAt: t.createdAt,
    })),
  };
}
