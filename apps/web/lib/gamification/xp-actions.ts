"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";
import { getLevelForXp } from "./xp-config";

export async function getLatestXpGains(since: Date): Promise<{
  gains: Array<{ amount: number; source: string }>;
  level: number;
  totalXp: number;
}> {
  const session = await auth();
  if (!session?.user?.id) return { gains: [], level: 1, totalXp: 0 };
  const userId = session.user.id;
  try {
    const { tenant, sessionId } = await getTenantFilter();
    const [transactions, userLevel] = await Promise.all([
      prisma.xpTransaction.findMany({
        where: { userId, createdAt: { gt: since }, tenant, sessionId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.userLevel.findFirst({ where: { userId, tenant, sessionId } }),
    ]);
    const totalXp = userLevel?.totalXp ?? 0;
    const level = getLevelForXp(totalXp);
    return {
      gains: transactions.map((t) => ({ amount: t.amount, source: t.source })),
      level: level.level,
      totalXp,
    };
  } catch (error) {
    console.error("[xp] getLatestXpGains failed:", error);
    return { gains: [], level: 1, totalXp: 0 };
  }
}

export async function getMyGamificationProfile(): Promise<{
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  recentAchievements: Array<{
    name: string;
    icon: string | null;
    tier: string | null;
    unlockedAt: Date;
  }>;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;
  try {
    const { tenant, sessionId } = await getTenantFilter();
    const [userLevel, streak, recentAchievements] = await Promise.all([
      prisma.userLevel.findFirst({ where: { userId, tenant, sessionId } }),
      prisma.loginStreak.findUnique({ where: { userId } }),
      prisma.userAchievement.findMany({
        where: { userId, tenant, sessionId },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
        take: 5,
      }),
    ]);
    const totalXp = userLevel?.totalXp ?? 0;
    return {
      totalXp,
      level: userLevel?.level ?? 1,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      recentAchievements: recentAchievements.map((ua) => ({
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        tier: ua.achievement.tier,
        unlockedAt: ua.unlockedAt,
      })),
    };
  } catch (error) {
    console.error("[xp] getMyGamificationProfile failed:", error);
    return null;
  }
}
