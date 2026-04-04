"use server";

import { prisma } from "./db";
import { auth } from "@/auth";
import { getTenantFilter } from "@/lib/tenant";

export type CustomQuestData = {
  id: string;
  title: string;
  description: string | null;
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
  name: true,
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

type RawQuestRow = {
  id: string;
  name: string;
  description: string | null;
  xpReward: number;
  status: string;
  priority: string;
  targetSkill: string | null;
  deadline: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignee: { id: string; alias: string | null; name: string | null; image: string | null } | null;
  creator: { id: string; alias: string | null; name: string | null } | null;
};

/** Maps a raw Quest row (with `name`) to the CustomQuestData shape (with `title`). */
function mapToCustomQuestData(raw: RawQuestRow): CustomQuestData {
  return {
    id: raw.id,
    title: raw.name,
    description: raw.description,
    xpReward: raw.xpReward,
    status: raw.status,
    priority: raw.priority,
    targetSkill: raw.targetSkill,
    deadline: raw.deadline,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    assignee: raw.assignee ?? { id: "", alias: null, name: null, image: null },
    creator: raw.creator ?? { id: "", alias: null, name: null },
  };
}

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

  const { tenant, sessionId } = await getTenantFilter();
  const where: Record<string, unknown> = {
    deletedAt: null,
    tenant,
    sessionId,
    assigneeId: { not: null },
  };
  if (filters?.status) where.status = filters.status;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

  const rows = await prisma.quest.findMany({
    where,
    select: QUEST_SELECT,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return (rows as unknown as RawQuestRow[]).map(mapToCustomQuestData);
}

/**
 * Get quests assigned to the current user.
 */
export async function getMyCustomQuests(): Promise<CustomQuestData[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const { tenant, sessionId } = await getTenantFilter();

  const rows = await prisma.quest.findMany({
    where: { assigneeId: session.user.id, deletedAt: null, tenant, sessionId },
    select: QUEST_SELECT,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return (rows as unknown as RawQuestRow[]).map(mapToCustomQuestData);
}

/**
 * Get a single custom quest by ID.
 * Returns null if user doesn't have access (must be assignee, or have quest:view/quest:manage).
 */
export async function getCustomQuestById(questId: string): Promise<CustomQuestData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { tenant, sessionId } = await getTenantFilter();

  const raw = await prisma.quest.findFirst({
    where: { id: questId, deletedAt: null, tenant, sessionId, assigneeId: { not: null } },
    select: QUEST_SELECT,
  });

  if (!raw) return null;

  const quest = mapToCustomQuestData(raw as unknown as RawQuestRow);

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

  const { tenant, sessionId } = await getTenantFilter();
  const baseWhere = { deletedAt: null, tenant, sessionId, assigneeId: { not: null } };

  const [open, inProgress, completed] = await Promise.all([
    prisma.quest.count({ where: { ...baseWhere, status: "open" } }),
    prisma.quest.count({ where: { ...baseWhere, status: "in_progress" } }),
    prisma.quest.count({ where: { ...baseWhere, status: "completed" } }),
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
  const { tenant, sessionId } = await getTenantFilter();

  const rows = await prisma.quest.findMany({
    where: {
      status: "completed",
      deletedAt: null,
      completedAt: { not: null },
      tenant,
      sessionId,
      assigneeId: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      xpReward: true,
      targetSkill: true,
      completedAt: true,
      assignee: { select: { alias: true, name: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.name,
    xpReward: r.xpReward,
    targetSkill: r.targetSkill,
    completedAt: r.completedAt!,
    assignee: r.assignee ?? { alias: null, name: null },
  }));
}
