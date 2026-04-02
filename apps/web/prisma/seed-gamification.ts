import path from "node:path";
import { loadEnvFile } from "node:process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { INITIAL_ACHIEVEMENTS, INITIAL_QUESTS } from "../lib/gamification/seed-data";

try {
  loadEnvFile(path.resolve(__dirname, "..", ".env.local"));
} catch {
  // .env.local may not exist in CI
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding gamification data...");

  // Seed achievements
  for (const achievement of INITIAL_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        tier: achievement.tier,
        category: achievement.category,
        xpReward: achievement.xpReward,
        criteria: achievement.criteria,
        sortOrder: achievement.sortOrder,
      },
      create: achievement,
    });
  }

  console.log(`Seeded ${INITIAL_ACHIEVEMENTS.length} achievements`);

  // Seed quests
  for (const quest of INITIAL_QUESTS) {
    await prisma.quest.upsert({
      where: { key: quest.key },
      update: {
        name: quest.name,
        description: quest.description,
        icon: quest.icon,
        type: quest.type,
        xpReward: quest.xpReward,
        criteria: quest.criteria,
        repeatable: quest.repeatable,
        sortOrder: quest.sortOrder,
      },
      create: quest,
    });
  }

  console.log(`Seeded ${INITIAL_QUESTS.length} quests`);

  // Clean up stale achievements/quests no longer in seed data
  const validAchievementKeys = INITIAL_ACHIEVEMENTS.map((a) => a.key);
  const staleAchievements = await prisma.achievement.findMany({
    where: { key: { notIn: validAchievementKeys } },
    select: { id: true, key: true },
  });
  if (staleAchievements.length > 0) {
    const staleIds = staleAchievements.map((a) => a.id);
    await prisma.userAchievement.deleteMany({ where: { achievementId: { in: staleIds } } });
    await prisma.achievement.deleteMany({ where: { id: { in: staleIds } } });
    console.log(
      `Removed ${staleAchievements.length} stale achievements: ${staleAchievements.map((a) => a.key).join(", ")}`,
    );
  }

  const validQuestKeys = INITIAL_QUESTS.map((q) => q.key);
  const staleQuests = await prisma.quest.findMany({
    where: { key: { notIn: validQuestKeys } },
    select: { id: true, key: true },
  });
  if (staleQuests.length > 0) {
    const staleIds = staleQuests.map((q) => q.id);
    await prisma.userQuestProgress.deleteMany({ where: { questId: { in: staleIds } } });
    await prisma.quest.deleteMany({ where: { id: { in: staleIds } } });
    console.log(
      `Removed ${staleQuests.length} stale quests: ${staleQuests.map((q) => q.key).join(", ")}`,
    );
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
