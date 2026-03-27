"use server";

import { auth } from "@/auth";
import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID } from "./actionUtils";
import { revalidatePath } from "next/cache";

function validateThreadBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new ActionError("threadBodyRequired", "Comment body is required");
  }
  if (trimmed.length > 5000) {
    throw new ActionError("threadBodyRequired", "Comment must be 5000 characters or less");
  }
  return trimmed;
}

export const createThread = guardedAction(
  "thread:create",
  "thread:create",
  async (
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

    const session = await auth();
    const authorId = session!.user!.id;

    await prisma.thread.create({
      data: {
        body: validBody,
        parentType,
        parentId,
        authorId,
        replyToId: replyToId ?? null,
      },
    });

    if (revalidateUrl) {
      revalidatePath(revalidateUrl);
    }
  },
);

export const deleteThread = guardedAction(
  "thread:delete",
  "thread:delete",
  async (threadId: string, revalidateUrl?: string) => {
    validateUUID(threadId, "threadId");

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, deletedAt: null },
    });
    if (!thread) {
      throw new ActionError("threadNotFound", "Comment not found");
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
