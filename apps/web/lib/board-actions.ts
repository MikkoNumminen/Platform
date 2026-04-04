"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID, createStringValidator } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { slugify } from "./slug-utils";
import { getTenantFilter } from "@/lib/tenant";

const validateBoardName = createStringValidator(
  "Board name",
  100,
  "invalidBoardName",
  "boardNameTooLong",
);

export const createBoard = guardedAction(
  "board:create",
  "board:create",
  async (_session, name: string, description?: string) => {
    const validName = validateBoardName(name);
    const slug = slugify(validName);
    const { tenant, sessionId } = await getTenantFilter();

    if (!slug) {
      throw new ActionError("invalidBoardName", "Board name produces an invalid URL slug");
    }

    const existing = await prisma.board.findFirst({
      where: { slug, deletedAt: null, tenant, sessionId },
    });
    if (existing) {
      throw new ActionError("boardSlugExists", "A board with this name already exists");
    }

    const maxSort = await prisma.board.aggregate({
      _max: { sortOrder: true },
      where: { deletedAt: null, tenant, sessionId },
    });

    await prisma.board.create({
      data: {
        name: validName,
        slug,
        description: description?.trim() || null,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        tenant,
        sessionId,
      },
    });

    revalidatePath("/boards");
  },
);

export const updateBoard = guardedAction(
  "board:edit",
  "board:edit",
  async (_session, boardId: string, name: string, description?: string) => {
    validateUUID(boardId, "boardId");
    const validName = validateBoardName(name);
    const slug = slugify(validName);
    const { tenant, sessionId } = await getTenantFilter();

    if (!slug) {
      throw new ActionError("invalidBoardName", "Board name produces an invalid URL slug");
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, deletedAt: null, tenant, sessionId },
    });
    if (!board) {
      throw new ActionError("boardNotFound", "Board not found");
    }

    const conflict = await prisma.board.findFirst({
      where: { slug, deletedAt: null, id: { not: boardId }, tenant, sessionId },
    });
    if (conflict) {
      throw new ActionError("boardSlugExists", "A board with this name already exists");
    }

    await prisma.board.update({
      where: { id: boardId },
      data: {
        name: validName,
        slug,
        description: description?.trim() || null,
      },
    });

    revalidatePath("/boards");
  },
);

export const deleteBoard = guardedAction(
  "board:delete",
  "board:delete",
  async (_session, boardId: string) => {
    validateUUID(boardId, "boardId");
    const { tenant, sessionId } = await getTenantFilter();

    const board = await prisma.board.findFirst({
      where: { id: boardId, deletedAt: null, tenant, sessionId },
    });
    if (!board) {
      throw new ActionError("boardNotFound", "Board not found");
    }

    await prisma.board.update({
      where: { id: boardId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/boards");
  },
);
