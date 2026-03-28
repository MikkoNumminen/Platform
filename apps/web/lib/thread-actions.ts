"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID, createStringValidator } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { triggerGamification } from "./gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";

const validateThreadBody = createStringValidator(
  "Comment",
  5000,
  "threadBodyRequired",
  "threadBodyRequired",
);

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
    const sessionId = await getDemoSessionId();

    // Verify parent exists
    if (parentType === "POST") {
      const post = await prisma.post.findFirst({
        where: { id: parentId, deletedAt: null, sessionId },
      });
      if (!post) {
        throw new ActionError("postNotFound", "Post not found");
      }
    }

    // Verify reply target exists
    if (replyToId) {
      const replyTarget = await prisma.thread.findFirst({
        where: { id: replyToId, deletedAt: null, sessionId },
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
        sessionId,
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
    const sessionId = await getDemoSessionId();

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, deletedAt: null, sessionId },
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
