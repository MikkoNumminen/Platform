"use server";

import { awardXp } from "./xp-service";
import { updateQuestProgress } from "./quest-service";
import { checkAchievements } from "./achievement-service";
import { logger } from "@/lib/logger";
import type { XpSource } from "./xp-config";

export async function triggerGamification(
  userId: string,
  source: XpSource,
  sourceId?: string,
): Promise<void> {
  try {
    await Promise.all([
      awardXp(userId, source, sourceId),
      updateQuestProgress(userId, source),
      checkAchievements(userId, source),
    ]);
  } catch (error) {
    logger.error("Error processing action", error, "gamification");
  }
}
