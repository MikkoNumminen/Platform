"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID, createStringValidator } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { awardCustomXp } from "./gamification/xp-service";
import { DEVELOPMENT_SKILL_OPTIONS } from "./survey-config";
import { logAudit } from "./audit";
import { getTenantFilter } from "@/lib/tenant";

const VALID_STATUSES = ["open", "in_progress", "completed"] as const;
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const VALID_SKILLS = DEVELOPMENT_SKILL_OPTIONS as readonly string[];

const validateTitle = createStringValidator(
  "Quest title",
  200,
  "questTitleRequired",
  "questTitleTooLong",
);
const validateDescription = createStringValidator(
  "Quest description",
  2000,
  "questDescriptionRequired",
  "questDescriptionRequired",
);

export const createCustomQuest = guardedAction(
  "quest:manage",
  "quest:create",
  async (
    session,
    title: string,
    description: string,
    assigneeId: string,
    xpReward: number,
    priority: string | null,
    deadline: string | null,
    targetSkill: string | null,
  ) => {
    const validTitle = validateTitle(title);
    const validDescription = validateDescription(description);
    validateUUID(assigneeId, "assigneeId");

    if (xpReward < 0 || xpReward > 10000) {
      throw new ActionError("invalidInput", "XP reward must be between 0 and 10,000");
    }

    if (priority && !VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])) {
      throw new ActionError("invalidInput", `Invalid priority: ${priority}`);
    }

    if (targetSkill && !VALID_SKILLS.includes(targetSkill)) {
      throw new ActionError("invalidInput", `Invalid skill: ${targetSkill}`);
    }

    const assignee = await prisma.user.findFirst({
      where: { id: assigneeId, deletedAt: null },
    });
    if (!assignee) {
      throw new ActionError("notFound", "Assignee not found");
    }

    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime())) throw new ActionError("invalidInput", "Invalid deadline date");
    }

    const { tenant, sessionId } = await getTenantFilter();

    const created = await prisma.quest.create({
      data: {
        name: validTitle,
        description: validDescription,
        xpReward: Math.round(xpReward),
        type: "assigned",
        priority: priority ?? "normal",
        targetSkill: targetSkill ?? null,
        assigneeId,
        creatorId: session.user.id,
        deadline: deadline ? new Date(deadline) : null,
        tenant,
        sessionId,
      },
    });

    await logAudit({
      action: "customQuest.create",
      entityType: "Quest",
      entityId: created.id,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: validTitle, assigneeId, xpReward, targetSkill },
    });

    revalidatePath("/admin/quests");
    revalidatePath("/my-quests");
  },
);

export const updateCustomQuest = guardedAction(
  "quest:manage",
  "quest:update",
  async (
    session,
    questId: string,
    data: {
      title?: string;
      description?: string;
      xpReward?: number;
      priority?: string;
      status?: string;
      assigneeId?: string;
      deadline?: string | null;
      targetSkill?: string | null;
    },
  ) => {
    validateUUID(questId, "questId");

    const { tenant, sessionId } = await getTenantFilter();
    const quest = await prisma.quest.findFirst({
      where: { id: questId, deletedAt: null, tenant, sessionId },
    });
    if (!quest) {
      throw new ActionError("questNotFound", "Quest not found");
    }

    if (quest.status === "completed") {
      throw new ActionError("questAlreadyCompleted", "Cannot edit a completed quest");
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.name = validateTitle(data.title);
    }
    if (data.description !== undefined) {
      updateData.description = validateDescription(data.description);
    }
    if (data.xpReward !== undefined) {
      if (data.xpReward < 0 || data.xpReward > 10000) {
        throw new ActionError("invalidInput", "XP reward must be between 0 and 10,000");
      }
      updateData.xpReward = Math.round(data.xpReward);
    }
    if (data.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(data.priority as (typeof VALID_PRIORITIES)[number])) {
        throw new ActionError("invalidInput", `Invalid priority: ${data.priority}`);
      }
      updateData.priority = data.priority;
    }
    if (data.status !== undefined) {
      if (!VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
        throw new ActionError("invalidQuestStatus", `Invalid status: ${data.status}`);
      }
      updateData.status = data.status;
    }
    if (data.assigneeId !== undefined) {
      validateUUID(data.assigneeId, "assigneeId");
      const assignee = await prisma.user.findFirst({
        where: { id: data.assigneeId, deletedAt: null },
      });
      if (!assignee) {
        throw new ActionError("notFound", "Assignee not found");
      }
      updateData.assigneeId = data.assigneeId;
    }
    if (data.deadline !== undefined) {
      if (data.deadline) {
        const d = new Date(data.deadline);
        if (isNaN(d.getTime())) throw new ActionError("invalidInput", "Invalid deadline date");
      }
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }
    if (data.targetSkill !== undefined) {
      if (data.targetSkill && !VALID_SKILLS.includes(data.targetSkill)) {
        throw new ActionError("invalidInput", `Invalid skill: ${data.targetSkill}`);
      }
      updateData.targetSkill = data.targetSkill || null;
    }

    await prisma.quest.update({
      where: { id: questId },
      data: updateData,
    });

    await logAudit({
      action: "customQuest.update",
      entityType: "Quest",
      entityId: questId,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: quest.name, changes: data },
    });

    revalidatePath("/admin/quests");
    revalidatePath("/my-quests");
  },
);

export const completeCustomQuest = guardedAction(
  "quest:manage",
  "quest:complete",
  async (session, questId: string) => {
    validateUUID(questId, "questId");

    const { tenant, sessionId } = await getTenantFilter();
    const quest = await prisma.quest.findFirst({
      where: { id: questId, deletedAt: null, tenant, sessionId },
    });
    if (!quest) {
      throw new ActionError("questNotFound", "Quest not found");
    }
    if (quest.status === "completed") {
      throw new ActionError("questAlreadyCompleted", "Quest is already completed");
    }

    await prisma.quest.update({
      where: { id: questId },
      data: { status: "completed", completedAt: new Date() },
    });

    // Award custom XP — double if assignee's skills match the quest's target skill
    let xpAwarded = 0;
    if (quest.xpReward > 0 && quest.assigneeId) {
      let xpAmount = quest.xpReward;

      if (quest.targetSkill) {
        const assignee = await prisma.user.findUnique({
          where: { id: quest.assigneeId },
          select: { developmentSkills: true },
        });
        if (assignee?.developmentSkills?.includes(quest.targetSkill)) {
          xpAmount *= 2;
        }
      }

      xpAwarded = xpAmount;
      await awardCustomXp(quest.assigneeId, xpAmount, "custom_quest:complete", quest.id);
    }

    // Also create a UserQuestProgress record marking the quest as completed
    if (quest.assigneeId) {
      await prisma.userQuestProgress.create({
        data: {
          userId: quest.assigneeId,
          questId: quest.id,
          progress: 1,
          completed: true,
          completedAt: new Date(),
          tenant,
          sessionId,
        },
      });
    }

    await logAudit({
      action: "customQuest.complete",
      entityType: "Quest",
      entityId: questId,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: quest.name, assigneeId: quest.assigneeId, xpAwarded },
    });

    revalidatePath("/admin/quests");
    revalidatePath("/my-quests");
  },
);

export const deleteCustomQuest = guardedAction(
  "quest:manage",
  "quest:delete",
  async (session, questId: string) => {
    validateUUID(questId, "questId");

    const { tenant, sessionId } = await getTenantFilter();
    const quest = await prisma.quest.findFirst({
      where: { id: questId, deletedAt: null, tenant, sessionId },
    });
    if (!quest) {
      throw new ActionError("questNotFound", "Quest not found");
    }

    await prisma.quest.update({
      where: { id: questId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      action: "customQuest.delete",
      entityType: "Quest",
      entityId: questId,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: quest.name },
    });

    revalidatePath("/admin/quests");
    revalidatePath("/my-quests");
  },
);
