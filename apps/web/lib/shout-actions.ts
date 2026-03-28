"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import { triggerGamification } from "./gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";

const MAX_SHOUT_LENGTH = 280;

export async function createShout(message: string): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > MAX_SHOUT_LENGTH) {
      throw new ActionError("invalidInput", "Message must be 1-280 characters");
    }

    await rateLimit("shout:create");

    const sessionId = await getDemoSessionId();

    await prisma.shout.create({
      data: {
        message: trimmed,
        authorId: session.user.id,
        sessionId,
      },
    });

    await triggerGamification(session.user.id, "shout:create");

    revalidatePath("/");
  });
}
