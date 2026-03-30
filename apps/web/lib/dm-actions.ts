"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import { triggerGamification } from "./gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";

const MAX_DM_LENGTH = 500;

export async function sendDirectMessage(
  conversationId: string,
  message: string,
): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }
    const userId = session.user.id;

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > MAX_DM_LENGTH) {
      throw new ActionError("invalidInput", "Message must be 1-500 characters");
    }

    await rateLimit("dm:send");

    // Verify user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantA: userId }, { participantB: userId }],
      },
    });
    if (!conversation) {
      throw new ActionError("permissionDenied", "Not a participant of this conversation");
    }

    const sessionId = await getDemoSessionId();

    await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        message: trimmed,
        sessionId,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    await triggerGamification(userId, "dm:send");

    revalidatePath("/");
  });
}

export async function startConversation(
  otherUserId: string,
  message: string,
): Promise<ActionResult & { conversationId?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", code: "permissionDenied" };
  }
  const userId = session.user.id;

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > MAX_DM_LENGTH) {
    return { error: "Message must be 1-500 characters", code: "invalidInput" };
  }

  try {
    await rateLimit("dm:send");
  } catch {
    return { error: "Rate limited", code: "rateLimited" };
  }

  const sessionId = await getDemoSessionId();

  // Verify other user exists and is in same session
  const otherUser = await prisma.user.findFirst({
    where: {
      id: otherUserId,
      sessionId,
      deletedAt: null,
      role: { not: "pending" },
      email: { not: "demo@platform.app" },
    },
  });
  if (!otherUser) {
    return { error: "User not found", code: "invalidInput" };
  }

  // Enforce lexicographic ordering for unique constraint
  const [participantA, participantB] =
    userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  // findFirst + create instead of upsert (null sessionId breaks unique constraint in upsert)
  let conversation = await prisma.conversation.findFirst({
    where: { participantA, participantB, sessionId },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { participantA, participantB, sessionId, lastMessageAt: new Date() },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  await prisma.directMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      message: trimmed,
      sessionId,
    },
  });

  await triggerGamification(userId, "dm:send");

  revalidatePath("/");

  return { conversationId: conversation.id } as ActionResult & { conversationId?: string };
}
