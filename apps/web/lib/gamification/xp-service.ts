"use server";

import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";
import { getLevelForXp, type XpSource, XP_AMOUNTS, DAILY_SHOUT_XP_CAP } from "./xp-config";

export interface XpAwardResult {
  xpAwarded: number;
  totalXp: number;
  level: number;
  previousLevel: number;
  leveledUp: boolean;
}

export async function awardXp(
  userId: string,
  source: XpSource,
  sourceId?: string,
): Promise<XpAwardResult | null> {
  const amount = XP_AMOUNTS[source];
  if (amount <= 0) return null;

  if (source === "shout:create") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayShoutXp = await prisma.xpTransaction.aggregate({
      _sum: { amount: true },
      where: { userId, source: "shout:create", createdAt: { gte: todayStart } },
    });
    if ((todayShoutXp._sum.amount ?? 0) >= DAILY_SHOUT_XP_CAP) return null;
  }

  await prisma.xpTransaction.create({ data: { userId, amount, source, sourceId } });

  const userLevel = await prisma.userLevel.upsert({
    where: { userId },
    create: { userId, totalXp: amount, level: getLevelForXp(amount).level },
    update: { totalXp: { increment: amount } },
  });

  const newTotalXp = userLevel.totalXp;
  const previousLevel = userLevel.level;
  const newLevel = getLevelForXp(newTotalXp).level;

  if (newLevel !== previousLevel) {
    await prisma.userLevel.update({ where: { userId }, data: { level: newLevel } });
  }

  return {
    xpAwarded: amount,
    totalXp: newTotalXp,
    level: newLevel,
    previousLevel,
    leveledUp: newLevel > previousLevel,
  };
}

export async function getUserXpData(userId: string) {
  try {
    const userLevel = await prisma.userLevel.findUnique({ where: { userId } });
    return { totalXp: userLevel?.totalXp ?? 0, level: userLevel?.level ?? 1 };
  } catch {
    return { totalXp: 0, level: 1 };
  }
}

export async function getLeaderboard(limit = 20) {
  try {
    const sessionId = await getDemoSessionId();
    const entries = await prisma.userLevel.findMany({
      where: { user: { deletedAt: null, sessionId } },
      orderBy: { totalXp: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, alias: true, name: true, image: true, avatarUrl: true, role: true },
        },
      },
    });
    return entries.map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      alias: e.user.alias,
      name: e.user.name,
      image: e.user.avatarUrl ?? e.user.image,
      role: e.user.role,
      totalXp: e.totalXp,
      level: e.level,
    }));
  } catch {
    return [];
  }
}

export async function getRecentXpTransactions(userId: string, limit = 20) {
  return prisma.xpTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
