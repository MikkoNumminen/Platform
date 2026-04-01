"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { triggerGamification } from "@/lib/gamification/trigger";
import { logAudit } from "@/lib/audit";

const MAX_FEEDBACK_LENGTH = 1000;

export async function submitFeedback(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: "Feedback cannot be empty" };
  if (trimmed.length > MAX_FEEDBACK_LENGTH)
    return { success: false, error: `Feedback must be under ${MAX_FEEDBACK_LENGTH} characters` };

  const userId = session.user.id;
  const demoSessionId = (session.user as { demoSessionId?: string }).demoSessionId;

  const feedback = await prisma.feedback.create({
    data: {
      message: trimmed,
      authorId: userId,
      sessionId: demoSessionId ?? undefined,
    },
  });

  try {
    await triggerGamification(userId, "feedback:submit", feedback.id);
  } catch {
    // Non-critical — don't fail the submission
  }

  return { success: true };
}

export async function replyToFeedback(
  feedbackId: string,
  reply: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const role = (session.user as { role?: string }).role;
  if (role !== "superuser" && role !== "vuohi" && role !== "admin") {
    return { success: false, error: "Not authorized" };
  }

  const trimmed = reply.trim();
  if (!trimmed) return { success: false, error: "Reply cannot be empty" };
  if (trimmed.length > MAX_FEEDBACK_LENGTH)
    return { success: false, error: `Reply must be under ${MAX_FEEDBACK_LENGTH} characters` };

  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback) return { success: false, error: "Feedback not found" };

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      adminReply: trimmed,
      adminReplyById: session.user.id,
      adminRepliedAt: new Date(),
    },
  });

  await logAudit({
    action: "feedback:reply",
    entityType: "feedback",
    entityId: feedbackId,
    actorId: session.user.id,
    details: { replyLength: trimmed.length },
  });

  return { success: true };
}

export interface FeedbackItem {
  id: string;
  message: string;
  createdAt: string;
  author: { id: string; alias: string | null; name: string | null; image: string | null };
  adminReply: string | null;
  adminRepliedAt: string | null;
  adminReplyBy: { alias: string | null; name: string | null } | null;
}

export async function getAllFeedback(): Promise<FeedbackItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const demoSessionId = (session.user as { demoSessionId?: string }).demoSessionId;

  const feedbacks = await prisma.feedback.findMany({
    where: demoSessionId ? { sessionId: demoSessionId } : { sessionId: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, alias: true, name: true, image: true } },
      adminReplyBy: { select: { alias: true, name: true } },
    },
  });

  return feedbacks.map((f) => ({
    id: f.id,
    message: f.message,
    createdAt: f.createdAt.toISOString(),
    author: f.author,
    adminReply: f.adminReply,
    adminRepliedAt: f.adminRepliedAt?.toISOString() ?? null,
    adminReplyBy: f.adminReplyBy,
  }));
}
