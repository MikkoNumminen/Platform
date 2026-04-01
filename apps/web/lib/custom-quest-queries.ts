"use server";

import { prisma } from "./db";
import { auth } from "@/auth";

export type CustomQuestData = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: string;
  priority: string;
  targetSkill: string | null;
  deadline: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignee: { id: string; alias: string | null; name: string | null; image: string | null };
  creator: { id: string; alias: string | null; name: string | null };
};

const QUEST_SELECT = {
  id: true,
  title: true,
  description: true,
  xpReward: true,
  status: true,
  priority: true,
  targetSkill: true,
  deadline: true,
  completedAt: true,
  createdAt: true,
  assignee: {
    select: { id: true, alias: true, name: true, image: true },
  },
  creator: {
    select: { id: true, alias: true, name: true },
  },
} as const;

/**
 * Get all custom quests (for admin/vuohi global view).
 * Requires quest:view or quest:manage permission.
 */
export async function getAllCustomQuests(filters?: {
  status?: string;
  assigneeId?: string;
}): Promise<CustomQuestData[]> {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};
  if (!permissions["quest:view"] && !permissions["quest:manage"]) {
    return [];
  }

  const where: Record<string, unknown> = { deletedAt: null };
  if (filters?.status) where.status = filters.status;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

  return prisma.customQuest.findMany({
    where,
    select: QUEST_SELECT,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  }) as Promise<CustomQuestData[]>;
}

/**
 * Get quests assigned to the current user.
 */
export async function getMyCustomQuests(): Promise<CustomQuestData[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.customQuest.findMany({
    where: { assigneeId: session.user.id, deletedAt: null },
    select: QUEST_SELECT,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  }) as Promise<CustomQuestData[]>;
}

/**
 * Get a single custom quest by ID.
 * Returns null if user doesn't have access (must be assignee, or have quest:view/quest:manage).
 */
export async function getCustomQuestById(questId: string): Promise<CustomQuestData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const quest = (await prisma.customQuest.findFirst({
    where: { id: questId, deletedAt: null },
    select: QUEST_SELECT,
  })) as CustomQuestData | null;

  if (!quest) return null;

  const permissions = (session.user.permissions as Record<string, boolean>) ?? {};
  const isAssignee = quest.assignee.id === session.user.id;
  const canView = permissions["quest:view"] || permissions["quest:manage"];

  if (!isAssignee && !canView) return null;

  return quest;
}

/**
 * Get quest counts by status (for dashboard widgets).
 */
export async function getCustomQuestCounts(): Promise<{
  open: number;
  inProgress: number;
  completed: number;
  total: number;
}> {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};
  if (!permissions["quest:view"] && !permissions["quest:manage"]) {
    return { open: 0, inProgress: 0, completed: 0, total: 0 };
  }

  const [open, inProgress, completed] = await Promise.all([
    prisma.customQuest.count({ where: { status: "open", deletedAt: null } }),
    prisma.customQuest.count({ where: { status: "in_progress", deletedAt: null } }),
    prisma.customQuest.count({ where: { status: "completed", deletedAt: null } }),
  ]);

  return { open, inProgress, completed, total: open + inProgress + completed };
}

/**
 * Get recently completed quests for the public feed.
 */
export async function getRecentCompletedQuests(limit = 10): Promise<
  Array<{
    id: string;
    title: string;
    xpReward: number;
    targetSkill: string | null;
    completedAt: Date;
    assignee: { alias: string | null; name: string | null };
  }>
> {
  return prisma.customQuest.findMany({
    where: { status: "completed", deletedAt: null, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      xpReward: true,
      targetSkill: true,
      completedAt: true,
      assignee: { select: { alias: true, name: true } },
    },
  }) as Promise<
    Array<{
      id: string;
      title: string;
      xpReward: number;
      targetSkill: string | null;
      completedAt: Date;
      assignee: { alias: string | null; name: string | null };
    }>
  >;
}
