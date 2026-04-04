"use server";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/actionErrors";
import { safe, requireUser, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import { triggerGamification } from "./gamification/trigger";
import { getTenantFilter } from "@/lib/tenant";

const MAX_SHOUT_LENGTH = 280;

export async function createShout(message: string): Promise<ActionResult> {
  return safe(async () => {
    const user = await requireUser();

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > MAX_SHOUT_LENGTH) {
      throw new ActionError("invalidInput", "Message must be 1-280 characters");
    }

    await rateLimit("shout:create");

    const { tenant, sessionId } = await getTenantFilter();

    await prisma.shout.create({
      data: {
        message: trimmed,
        authorId: user.id,
        tenant,
        sessionId,
      },
    });

    await triggerGamification(user.id, "shout:create");

    revalidatePath("/");
  });
}
