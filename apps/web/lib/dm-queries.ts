"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getTenantFilter } from "@/lib/tenant";
import { getDemoSessionId } from "@/lib/demo-session";
import { DEMO_EMAIL } from "@/lib/demo-constants";

export interface ConversationSummary {
  id: string;
  otherUser: { id: string; alias: string; role: string; developerTag: string | null };
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
  senderDevTag: string | null;
  isMe: boolean;
  createdAt: string;
}

const DM_LIMIT = 50;

export async function getMyConversations(): Promise<ConversationSummary[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;
  const { tenant, sessionId } = await getTenantFilter();

  const conversations = await prisma.conversation.findMany({
    where: {
      tenant,
      sessionId,
      OR: [{ participantA: userId }, { participantB: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: { id: true, alias: true, name: true, role: true, developerTag: true } },
      userB: { select: { id: true, alias: true, name: true, role: true, developerTag: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { message: true },
      },
    },
  });

  const unreadCounts = await prisma.directMessage.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadCounts.map((r) => [r.conversationId, r._count._all]));

  const results: ConversationSummary[] = [];

  for (const conv of conversations) {
    const otherUser = conv.participantA === userId ? conv.userB : conv.userA;

    results.push({
      id: conv.id,
      otherUser: {
        id: otherUser.id,
        alias: otherUser.alias ?? otherUser.name ?? "Unknown",
        role: otherUser.role,
        developerTag: otherUser.developerTag,
      },
      lastMessage: conv.messages[0]?.message ?? null,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      unreadCount: unreadMap.get(conv.id) ?? 0,
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
      sender: { select: { id: true, alias: true, name: true, role: true, developerTag: true } },
    },
  });

  return messages.map((m) => ({
    id: m.id,
    message: m.message,
    senderId: m.sender.id,
    senderAlias: m.sender.alias ?? m.sender.name ?? "Unknown",
    senderRole: m.sender.role,
    senderDevTag: m.sender.developerTag,
    isMe: m.sender.id === userId,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function getDmUsers(): Promise<
  Array<{
    id: string;
    alias: string;
    role: string;
    developerTag: string | null;
  }>
> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const sessionId = await getDemoSessionId();

  const users = await prisma.user.findMany({
    where: {
      sessionId,
      deletedAt: null,
      id: { not: session.user.id },
      role: { not: "pending" },
      email: { not: DEMO_EMAIL },
    },
    select: { id: true, alias: true, name: true, role: true, developerTag: true },
    orderBy: { alias: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    alias: u.alias ?? u.name ?? "Unknown",
    role: u.role,
    developerTag: u.developerTag,
  }));
}

export async function getDmUserDetails(userId: string): Promise<{
  id: string;
  alias: string;
  name: string | null;
  email: string | null;
  role: string;
  developerTag: string | null;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, alias: true, name: true, email: true, role: true, developerTag: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    alias: user.alias ?? user.name ?? "Unknown",
    name: user.name,
    email: user.email,
    role: user.role,
    developerTag: user.developerTag,
  };
}
