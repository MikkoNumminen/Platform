"use server";

import { prisma } from "@/lib/db";

async function getActionCount(userId: string, action: string): Promise<number> {
  switch (action) {
    case "shout:create":
      return prisma.shout.count({ where: { authorId: userId } });
    case "issue:create":
      return prisma.issueReport.count({ where: { authorId: userId } });
    case "survey:complete":
      return prisma.surveyResponse.count({ where: { userId } });
    case "alias:set": {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { alias: true } });
      return user?.alias ? 1 : 0;
    }
    case "login:streak": {
      const streak = await prisma.loginStreak.findUnique({ where: { userId } });
      return streak?.longestStreak ?? 0;
    }
    case "feedback:submit":
      return prisma.feedback.count({ where: { authorId: userId } });
    case "tour:complete": {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      const role = user?.role ?? "pending";
      const { getStepsForRole } = await import("@/lib/tutorial/tutorial-config");
      const totalSteps = getStepsForRole(role).length;
      const completedSteps = await prisma.userTourProgress.count({ where: { userId } });
      return completedSteps >= totalSteps ? 1 : 0;
    }
    default:
      return 0;
  }
}

export async function checkAchievements(userId: string, action: string) {
  const allAchievements = await prisma.achievement.findMany();
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const results: Array<{ achievementKey: string; unlocked: boolean; xpAwarded: number }> = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;
    const criteria = achievement.criteria as { type: string; action: string; threshold: number };
    if (criteria.action !== action) continue;
    if (criteria.type === "count") {
      const count = await getActionCount(userId, criteria.action);
      if (count >= criteria.threshold) {
        await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        let xpAwarded = 0;
        if (achievement.xpReward > 0) {
          await prisma.xpTransaction.create({
            data: {
              userId,
              amount: achievement.xpReward,
              source: "achievement:unlock",
              sourceId: achievement.id,
            },
          });
          await prisma.userLevel.upsert({
            where: { userId },
            create: { userId, totalXp: achievement.xpReward, level: 1 },
            update: { totalXp: { increment: achievement.xpReward } },
          });
          xpAwarded = achievement.xpReward;
        }
        results.push({ achievementKey: achievement.key, unlocked: true, xpAwarded });
      }
    }
  }
  return results;
}

export async function getUserAchievements(userId: string) {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });
  return unlocked.map((ua) => ({ ...ua.achievement, unlockedAt: ua.unlockedAt }));
}

export async function getAllAchievementsWithStatus(userId: string) {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });
    const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]));
    return achievements.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));
  } catch {
    return [];
  }
}
