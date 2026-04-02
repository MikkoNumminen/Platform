/**
 * One-time backfill script: awards achievements to users who already
 * qualify but never had them recorded (e.g. alias set or survey completed
 * before the gamification system was deployed).
 *
 * Usage: npx tsx prisma/backfill-achievements.ts
 */

import path from "node:path";
import { loadEnvFile } from "node:process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getLevelForXp } from "../lib/gamification/xp-config";

try {
  loadEnvFile(path.resolve(__dirname, "..", ".env.local"));
} catch {
  // .env.local may not exist in CI
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
      // Inline the step count logic to avoid "use server" import issues
      const totalSteps = role === "superuser" ? 13 : role === "admin" ? 10 : 7;
      const completedSteps = await prisma.userTourProgress.count({ where: { userId } });
      return completedSteps >= totalSteps ? 1 : 0;
    }
    case "tour:step":
      return prisma.userTourProgress.count({ where: { userId } });
    default:
      return 0;
  }
}

async function main() {
  console.log("Backfilling achievements...\n");

  const users = await prisma.user.findMany({
    where: { deletedAt: null, sessionId: null },
    select: { id: true, alias: true, name: true },
  });

  const achievements = await prisma.achievement.findMany();

  let totalAwarded = 0;

  for (const user of users) {
    const displayName = user.alias ?? user.name ?? user.id;
    const existing = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(existing.map((ua) => ua.achievementId));

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as { type: string; action: string; threshold: number };
      if (criteria.type !== "count") continue;

      const count = await getActionCount(user.id, criteria.action);
      if (count < criteria.threshold) continue;

      // Award the achievement
      await prisma.userAchievement.create({
        data: { userId: user.id, achievementId: achievement.id },
      });

      // Award XP if applicable
      if (achievement.xpReward > 0) {
        await prisma.xpTransaction.create({
          data: {
            userId: user.id,
            amount: achievement.xpReward,
            source: "achievement:unlock",
            sourceId: achievement.id,
          },
        });

        const userLevel = await prisma.userLevel.upsert({
          where: { userId: user.id },
          create: { userId: user.id, totalXp: achievement.xpReward, level: 1 },
          update: { totalXp: { increment: achievement.xpReward } },
        });

        const newLevel = getLevelForXp(userLevel.totalXp).level;
        if (newLevel !== userLevel.level) {
          await prisma.userLevel.update({
            where: { userId: user.id },
            data: { level: newLevel },
          });
        }
      }

      console.log(
        `  ✓ ${displayName}: unlocked "${achievement.name}" (+${achievement.xpReward} XP)`,
      );
      totalAwarded++;
    }
  }

  console.log(`Backfilled ${totalAwarded} achievement(s) for ${users.length} user(s).\n`);

  // --- Quest progress backfill ---
  console.log("Backfilling quest progress...\n");

  const quests = await prisma.quest.findMany();
  let questsAwarded = 0;

  for (const user of users) {
    const displayName = user.alias ?? user.name ?? user.id;
    const existingProgress = await prisma.userQuestProgress.findMany({
      where: { userId: user.id },
      select: { questId: true, completed: true },
    });
    const completedQuestIds = new Set(
      existingProgress.filter((p) => p.completed).map((p) => p.questId),
    );

    for (const quest of quests) {
      if (completedQuestIds.has(quest.id)) continue;
      if (quest.repeatable) continue; // Only backfill one-time quests

      const criteria = quest.criteria as { action: string; count: number };
      const count = await getActionCount(user.id, criteria.action);
      if (count < criteria.count) continue;

      // Mark quest as completed
      await prisma.userQuestProgress.upsert({
        where: { userId_questId: { userId: user.id, questId: quest.id } },
        create: {
          userId: user.id,
          questId: quest.id,
          progress: criteria.count,
          completed: true,
          completedAt: new Date(),
        },
        update: {
          progress: criteria.count,
          completed: true,
          completedAt: new Date(),
        },
      });

      // Award XP if applicable
      if (quest.xpReward > 0) {
        // Check if XP was already awarded for this quest
        const existingXp = await prisma.xpTransaction.findFirst({
          where: { userId: user.id, source: "quest:complete", sourceId: quest.id },
        });
        if (!existingXp) {
          await prisma.xpTransaction.create({
            data: {
              userId: user.id,
              amount: quest.xpReward,
              source: "quest:complete",
              sourceId: quest.id,
            },
          });
          await prisma.userLevel.upsert({
            where: { userId: user.id },
            create: { userId: user.id, totalXp: quest.xpReward, level: 1 },
            update: { totalXp: { increment: quest.xpReward } },
          });
          const userLevel = await prisma.userLevel.findUnique({ where: { userId: user.id } });
          if (userLevel) {
            const newLevel = getLevelForXp(userLevel.totalXp).level;
            if (newLevel !== userLevel.level) {
              await prisma.userLevel.update({
                where: { userId: user.id },
                data: { level: newLevel },
              });
            }
          }
        }
      }

      console.log(`  ✓ ${displayName}: completed "${quest.name}" (+${quest.xpReward} XP)`);
      questsAwarded++;
    }
  }

  console.log(
    `\nDone! Backfilled ${totalAwarded} achievement(s) and ${questsAwarded} quest(s) for ${users.length} user(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
