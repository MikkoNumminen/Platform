"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";

export async function markPromotionSeen(): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasSeenPromotion: true,
        permissionsVersion: { increment: 1 },
      },
    });
  });
}
