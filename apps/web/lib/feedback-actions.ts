"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/actionErrors";
import { safe, requireUser, requireAdmin, createStringValidator } from "@/lib/actionUtils";
import type { ActionResult } from "@/lib/actionUtils";
import { triggerGamification } from "@/lib/gamification/trigger";
import { logAudit } from "@/lib/audit";

const validateFeedback = createStringValidator("Feedback", 1000, "invalidInput", "invalidInput");

export async function submitFeedback(message: string): Promise<ActionResult> {
  return safe(async () => {
    const user = await requireUser();
    const trimmed = validateFeedback(message);

    const demoSessionId = (user as { demoSessionId?: string }).demoSessionId;

    const feedback = await prisma.feedback.create({
      data: {
        message: trimmed,
        authorId: user.id,
        sessionId: demoSessionId ?? undefined,
      },
    });

    try {
      await triggerGamification(user.id, "feedback:submit", feedback.id);
    } catch {
      // Non-critical
    }
  });
}

export async function replyToFeedback(feedbackId: string, reply: string): Promise<ActionResult> {
  return safe(async () => {
    const user = await requireAdmin();
    const trimmed = validateFeedback(reply);

    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new ActionError("notFound", "Feedback not found");

    await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        adminReply: trimmed,
        adminReplyById: user.id,
        adminRepliedAt: new Date(),
      },
    });

    await logAudit({
      action: "feedback:reply",
      entityType: "feedback",
      entityId: feedbackId,
      actorId: user.id,
      details: { replyLength: trimmed.length },
    });
  });
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
