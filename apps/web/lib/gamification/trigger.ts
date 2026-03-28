"use server";

import { awardXp } from "./xp-service";
import { updateQuestProgress } from "./quest-service";
import { checkAchievements } from "./achievement-service";
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
    console.error("[gamification] Error processing action:", error);
  }
}
