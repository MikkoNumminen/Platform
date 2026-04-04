"use server";

import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";
import { awardXp } from "./xp-service";
import { updateQuestProgress } from "./quest-service";
import { checkAchievements } from "./achievement-service";

export async function recordLogin(
  userId: string,
): Promise<{ streak: number; xpAwarded: number; isNewDay: boolean }> {
  const { tenant, sessionId } = await getTenantFilter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.loginStreak.findUnique({ where: { userId } });

  if (!existing) {
    await prisma.loginStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastLoginDate: today, tenant, sessionId },
    });
    const result = await awardXp(userId, "daily:login");
    await updateQuestProgress(userId, "daily:login");
    return { streak: 1, xpAwarded: result?.xpAwarded ?? 0, isNewDay: true };
  }

  const lastLogin = new Date(existing.lastLoginDate);
  lastLogin.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { streak: existing.currentStreak, xpAwarded: 0, isNewDay: false };

  const newStreak = diffDays === 1 ? existing.currentStreak + 1 : 1;
  const longestStreak = Math.max(existing.longestStreak, newStreak);

  await prisma.loginStreak.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak, lastLoginDate: today },
  });

  let totalXp = 0;
  const loginResult = await awardXp(userId, "daily:login");
  totalXp += loginResult?.xpAwarded ?? 0;
  if (newStreak === 7) {
    const r = await awardXp(userId, "streak:7day");
    totalXp += r?.xpAwarded ?? 0;
  }
  if (newStreak === 30) {
    const r = await awardXp(userId, "streak:30day");
    totalXp += r?.xpAwarded ?? 0;
  }

  await updateQuestProgress(userId, "daily:login");
  await checkAchievements(userId, "login:streak");

  return { streak: newStreak, xpAwarded: totalXp, isNewDay: true };
}

export async function getLoginStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Date | null;
}> {
  const streak = await prisma.loginStreak.findUnique({ where: { userId } });
  return {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastLoginDate: streak?.lastLoginDate ?? null,
  };
}
