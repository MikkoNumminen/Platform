"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { awardCustomXp } from "@/lib/gamification/xp-service";

/**
 * Auto-complete a campaign quest by matching the title prefix.
 * Finds the user's oldest uncompleted quest with the given title and marks it done.
 */
export async function autoCompleteCampaignQuest(
  userId: string,
  titlePrefix: string,
): Promise<void> {
  try {
    const quest = await prisma.quest.findFirst({
      where: {
        assigneeId: userId,
        name: { startsWith: titlePrefix },
        status: { not: "completed" },
        deletedAt: null,
        deadline: { not: null },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!quest) return;

    await prisma.quest.update({
      where: { id: quest.id },
      data: { status: "completed", completedAt: new Date() },
    });

    if (quest.xpReward > 0) {
      await awardCustomXp(userId, quest.xpReward, "custom_quest:complete", quest.id);
    }
  } catch {
    // Never break the parent action
  }
}

/**
 * Client-callable: mark the whisper quest as done for the current user.
 */
export async function completeWhisperQuest(): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) return;
    await autoCompleteCampaignQuest(session.user.id, "Use the /w whisper command");
  } catch {
    // Silent
  }
}
