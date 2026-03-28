"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { triggerGamification } from "./gamification/trigger";

const MAX_THREAD_BODY_LENGTH = 5000;

function validateThreadBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new ActionError("threadBodyRequired", "Comment body is required");
  }
  if (trimmed.length > MAX_THREAD_BODY_LENGTH) {
    throw new ActionError(
      "threadBodyRequired",
      `Comment must be ${MAX_THREAD_BODY_LENGTH} characters or less`,
    );
  }
  return trimmed;
}

export const createThread = guardedAction(
  "thread:create",
  "thread:create",
  async (
    session,
    parentType: "POST" | "TOPIC",
    parentId: string,
    body: string,
    replyToId?: string,
    revalidateUrl?: string,
  ) => {
    validateUUID(parentId, "parentId");
    if (replyToId) validateUUID(replyToId, "replyToId");
    const validBody = validateThreadBody(body);

    // Verify parent exists
    if (parentType === "POST") {
      const post = await prisma.post.findFirst({
        where: { id: parentId, deletedAt: null },
      });
      if (!post) {
        throw new ActionError("postNotFound", "Post not found");
      }
    }

    // Verify reply target exists
    if (replyToId) {
      const replyTarget = await prisma.thread.findFirst({
        where: { id: replyToId, deletedAt: null },
      });
      if (!replyTarget) {
        throw new ActionError("threadNotFound", "Reply target not found");
      }
    }

    const authorId = session.user.id;

    await prisma.thread.create({
      data: {
        body: validBody,
        parentType,
        parentId,
        authorId,
        replyToId: replyToId ?? null,
      },
    });

    await triggerGamification(authorId, "thread:create");

    if (revalidateUrl) {
      revalidatePath(revalidateUrl);
    }
  },
);

export const deleteThread = guardedAction(
  "thread:delete",
  "thread:delete",
  async (session, threadId: string, revalidateUrl?: string) => {
    validateUUID(threadId, "threadId");

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, deletedAt: null },
    });
    if (!thread) {
      throw new ActionError("threadNotFound", "Comment not found");
    }

    // Only the author or an admin-level user can delete
    const role = session.user.role ?? "pending";
    const isAdmin = ["superuser", "vuohi", "admin"].includes(role);
    if (thread.authorId !== session.user.id && !isAdmin) {
      throw new ActionError("permissionDenied", "You can only delete your own comments");
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { deletedAt: new Date() },
    });

    if (revalidateUrl) {
      revalidatePath(revalidateUrl);
    }
  },
);
