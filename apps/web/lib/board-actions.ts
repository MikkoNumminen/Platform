"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID } from "./actionUtils";
import { revalidatePath } from "next/cache";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateBoardName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ActionError("invalidBoardName", "Board name is required");
  }
  if (trimmed.length > 100) {
    throw new ActionError("boardNameTooLong", "Board name must be 100 characters or less");
  }
  return trimmed;
}

export const createBoard = guardedAction(
  "board:create",
  "board:create",
  async (name: string, description?: string) => {
    const validName = validateBoardName(name);
    const slug = slugify(validName);

    if (!slug) {
      throw new ActionError("invalidBoardName", "Board name produces an invalid URL slug");
    }

    const existing = await prisma.board.findFirst({
      where: { slug, deletedAt: null },
    });
    if (existing) {
      throw new ActionError("boardSlugExists", "A board with this name already exists");
    }

    const maxSort = await prisma.board.aggregate({
      _max: { sortOrder: true },
      where: { deletedAt: null },
    });

    await prisma.board.create({
      data: {
        name: validName,
        slug,
        description: description?.trim() || null,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath("/boards");
  },
);

export const updateBoard = guardedAction(
  "board:edit",
  "board:edit",
  async (boardId: string, name: string, description?: string) => {
    validateUUID(boardId, "boardId");
    const validName = validateBoardName(name);
    const slug = slugify(validName);

    if (!slug) {
      throw new ActionError("invalidBoardName", "Board name produces an invalid URL slug");
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, deletedAt: null },
    });
    if (!board) {
      throw new ActionError("boardNotFound", "Board not found");
    }

    const conflict = await prisma.board.findFirst({
      where: { slug, deletedAt: null, id: { not: boardId } },
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
  async (boardId: string) => {
    validateUUID(boardId, "boardId");

    const board = await prisma.board.findFirst({
      where: { id: boardId, deletedAt: null },
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
