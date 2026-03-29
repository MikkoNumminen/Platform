"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getDemoSessionId } from "@/lib/demo-session";

export interface ConversationSummary {
  id: string;
  otherUser: { id: string; alias: string; role: string };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  isPrivacy: boolean;
}

export interface DmMessageData {
  id: string;
  message: string;
  senderId: string;
  senderAlias: string;
  senderRole: string;
  isMe: boolean;
  createdAt: string;
}

const DM_LIMIT = 50;

export async function getMyConversations(): Promise<ConversationSummary[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;
  const sessionId = await getDemoSessionId();

  const conversations = await prisma.conversation.findMany({
    where: {
      sessionId,
      OR: [{ participantA: userId }, { participantB: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: { id: true, alias: true, name: true, role: true } },
      userB: { select: { id: true, alias: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { message: true },
      },
    },
  });

  const results: ConversationSummary[] = [];

  for (const conv of conversations) {
    const otherUser = conv.participantA === userId ? conv.userB : conv.userA;

    const unreadCount = await prisma.directMessage.count({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        readAt: null,
      },
    });

    results.push({
      id: conv.id,
      otherUser: {
        id: otherUser.id,
        alias: otherUser.alias ?? otherUser.name ?? "Unknown",
        role: otherUser.role,
      },
      lastMessage: conv.messages[0]?.message ?? null,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      unreadCount,
      isPrivacy: conv.isPrivacy,
    });
  }

  return results;
}

export async function getConversationMessages(conversationId: string): Promise<DmMessageData[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  // Verify user is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantA: userId }, { participantB: userId }],
    },
  });
  if (!conversation) return [];

  // Mark unread messages as read
  await prisma.directMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: DM_LIMIT,
    include: {
      sender: { select: { id: true, alias: true, name: true, role: true } },
    },
  });

  return messages.map((m) => ({
    id: m.id,
    message: m.message,
    senderId: m.sender.id,
    senderAlias: m.sender.alias ?? m.sender.name ?? "Unknown",
    senderRole: m.sender.role,
    isMe: m.sender.id === userId,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function getDmUsers(): Promise<Array<{ id: string; alias: string; role: string }>> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const sessionId = await getDemoSessionId();

  const users = await prisma.user.findMany({
    where: {
      sessionId,
      deletedAt: null,
      id: { not: session.user.id },
      role: { not: "pending" },
    },
    select: { id: true, alias: true, name: true, role: true },
    orderBy: { alias: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    alias: u.alias ?? u.name ?? "Unknown",
    role: u.role,
  }));
}
