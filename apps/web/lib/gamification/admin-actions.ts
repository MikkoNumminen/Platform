"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { safe, validateUUID, type ActionResult } from "@/lib/actionUtils";
import { ActionError } from "@/lib/actionErrors";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";

async function requireAdmin(): Promise<{ id: string; name: string | null }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ActionError("permissionDenied", "Not authenticated");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, alias: true, name: true },
  });
  if (!user || (user.role !== "admin" && user.role !== "superuser")) {
    throw new ActionError("permissionDenied", "Admin access required");
  }
  return { id: session.user.id, name: user.alias ?? user.name };
}

function validateAchievementInput(data: {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: unknown;
}) {
  if (!data.key?.trim()) throw new ActionError("invalidInput", "Key is required");
  if (!data.name?.trim()) throw new ActionError("invalidInput", "Name is required");
  if (!data.description?.trim()) throw new ActionError("invalidInput", "Description is required");
  if (!data.icon?.trim()) throw new ActionError("invalidInput", "Icon is required");
  if (!data.category?.trim()) throw new ActionError("invalidInput", "Category is required");
  if (!data.criteria || typeof data.criteria !== "object") {
    throw new ActionError("invalidInput", "Criteria must be a valid object");
  }
}

function validateQuestInput(data: {
  key: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  xpReward: number;
  criteria: unknown;
}) {
  if (!data.key?.trim()) throw new ActionError("invalidInput", "Key is required");
  if (!data.name?.trim()) throw new ActionError("invalidInput", "Name is required");
  if (!data.description?.trim()) throw new ActionError("invalidInput", "Description is required");
  if (!data.icon?.trim()) throw new ActionError("invalidInput", "Icon is required");
  if (!data.type?.trim()) throw new ActionError("invalidInput", "Type is required");
  if (typeof data.xpReward !== "number" || data.xpReward < 0) {
    throw new ActionError("invalidInput", "XP reward must be a non-negative number");
  }
  if (!data.criteria || typeof data.criteria !== "object") {
    throw new ActionError("invalidInput", "Criteria must be a valid object");
  }
}

export async function createAchievement(data: {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier?: string | null;
  category: string;
  xpReward?: number;
  criteria: Record<string, unknown>;
  sortOrder?: number;
}): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireAdmin();
    validateAchievementInput(data);

    const existing = await prisma.achievement.findUnique({ where: { key: data.key.trim() } });
    if (existing) throw new ActionError("conflict", "An achievement with this key already exists");

    const created = await prisma.achievement.create({
      data: {
        key: data.key.trim(),
        name: data.name.trim(),
        description: data.description.trim(),
        icon: data.icon.trim(),
        tier: data.tier ?? null,
        category: data.category.trim(),
        xpReward: data.xpReward ?? 0,
        criteria: data.criteria as Prisma.InputJsonValue as Prisma.InputJsonValue,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await logAudit({
      action: "achievement.create",
      entityType: "Achievement",
      entityId: created.id,
      actorId: actor.id,
      actorName: actor.name,
      details: { key: data.key, name: data.name },
    });

    revalidatePath("/admin/gamification/manage");
  });
}

export async function updateAchievement(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    tier?: string | null;
    category?: string;
    xpReward?: number;
    criteria?: Record<string, unknown>;
    sortOrder?: number;
  },
): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireAdmin();
    validateUUID(id, "achievement ID");

    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) throw new ActionError("notFound", "Achievement not found");

    await prisma.achievement.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.icon !== undefined && { icon: data.icon.trim() }),
        ...(data.tier !== undefined && { tier: data.tier }),
        ...(data.category !== undefined && { category: data.category.trim() }),
        ...(data.xpReward !== undefined && { xpReward: data.xpReward }),
        ...(data.criteria !== undefined && { criteria: data.criteria as Prisma.InputJsonValue }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    await logAudit({
      action: "achievement.update",
      entityType: "Achievement",
      entityId: id,
      actorId: actor.id,
      actorName: actor.name,
      details: { name: existing.name, changes: data },
    });

    revalidatePath("/admin/gamification/manage");
  });
}

export async function deleteAchievement(id: string): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireAdmin();
    validateUUID(id, "achievement ID");

    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) throw new ActionError("notFound", "Achievement not found");

    await prisma.achievement.delete({ where: { id } });

    await logAudit({
      action: "achievement.delete",
      entityType: "Achievement",
      entityId: id,
      actorId: actor.id,
      actorName: actor.name,
      details: { key: existing.key, name: existing.name },
    });

    revalidatePath("/admin/gamification/manage");
  });
}

export async function createQuest(data: {
  key: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  xpReward: number;
  criteria: Record<string, unknown>;
  repeatable?: boolean;
  sortOrder?: number;
}): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireAdmin();
    validateQuestInput(data);

    const existing = await prisma.quest.findUnique({ where: { key: data.key.trim() } });
    if (existing) throw new ActionError("conflict", "A quest with this key already exists");

    const created = await prisma.quest.create({
      data: {
        key: data.key.trim(),
        name: data.name.trim(),
        description: data.description.trim(),
        icon: data.icon.trim(),
        type: data.type.trim(),
        xpReward: data.xpReward,
        criteria: data.criteria as Prisma.InputJsonValue,
        repeatable: data.repeatable ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await logAudit({
      action: "quest.create",
      entityType: "Quest",
      entityId: created.id,
      actorId: actor.id,
      actorName: actor.name,
      details: { key: data.key, name: data.name, xpReward: data.xpReward },
    });

    revalidatePath("/admin/gamification/manage");
  });
}

export async function updateQuest(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    type?: string;
    xpReward?: number;
    criteria?: Record<string, unknown>;
    repeatable?: boolean;
    sortOrder?: number;
  },
): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireAdmin();
    validateUUID(id, "quest ID");

    const existing = await prisma.quest.findUnique({ where: { id } });
    if (!existing) throw new ActionError("notFound", "Quest not found");

    await prisma.quest.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.icon !== undefined && { icon: data.icon.trim() }),
        ...(data.type !== undefined && { type: data.type.trim() }),
        ...(data.xpReward !== undefined && { xpReward: data.xpReward }),
        ...(data.criteria !== undefined && { criteria: data.criteria as Prisma.InputJsonValue }),
        ...(data.repeatable !== undefined && { repeatable: data.repeatable }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    await logAudit({
      action: "quest.update",
      entityType: "Quest",
      entityId: id,
      actorId: actor.id,
      actorName: actor.name,
      details: { name: existing.name, changes: data },
    });

    revalidatePath("/admin/gamification/manage");
  });
}

export async function deleteQuest(id: string): Promise<ActionResult> {
  return safe(async () => {
    const actor = await requireAdmin();
    validateUUID(id, "quest ID");

    const existing = await prisma.quest.findUnique({ where: { id } });
    if (!existing) throw new ActionError("notFound", "Quest not found");

    await prisma.quest.delete({ where: { id } });

    await logAudit({
      action: "quest.delete",
      entityType: "Quest",
      entityId: id,
      actorId: actor.id,
      actorName: actor.name,
      details: { key: existing.key, name: existing.name },
    });

    revalidatePath("/admin/gamification/manage");
  });
}
