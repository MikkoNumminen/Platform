"use server";

import { auth } from "@/auth";
import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { slugify } from "./slug-utils";
import { triggerGamification } from "./gamification/trigger";

function validatePostTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new ActionError("invalidPostTitle", "Post title is required");
  }
  if (trimmed.length > 200) {
    throw new ActionError("postTitleTooLong", "Post title must be 200 characters or less");
  }
  return trimmed;
}

function validatePostBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new ActionError("postBodyRequired", "Post body is required");
  }
  if (trimmed.length > 10000) {
    throw new ActionError("postBodyRequired", "Post body must be 10000 characters or less");
  }
  return trimmed;
}

export const createPost = guardedAction(
  "post:create",
  "post:create",
  async (boardId: string, title: string, body: string) => {
    validateUUID(boardId, "boardId");
    const validTitle = validatePostTitle(title);
    const validBody = validatePostBody(body);
    const baseSlug = slugify(validTitle);

    if (!baseSlug) {
      throw new ActionError("invalidPostTitle", "Post title produces an invalid URL slug");
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, deletedAt: null },
    });
    if (!board) {
      throw new ActionError("boardNotFound", "Board not found");
    }

    const session = await auth();
    const authorId = session!.user!.id;

    // Ensure unique slug within board
    let slug = baseSlug;
    let suffix = 1;
    while (
      await prisma.post.findFirst({
        where: { boardId, slug, deletedAt: null },
      })
    ) {
      slug = `${baseSlug}-${suffix++}`;
    }

    await prisma.post.create({
      data: {
        title: validTitle,
        slug,
        body: validBody,
        authorId,
        boardId,
      },
    });

    await triggerGamification(authorId, "post:create");

    revalidatePath(`/boards/${board.slug}`);
  },
);

export const updatePost = guardedAction(
  "post:edit",
  "post:edit",
  async (postId: string, title: string, body: string) => {
    validateUUID(postId, "postId");
    const validTitle = validatePostTitle(title);
    const validBody = validatePostBody(body);

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: { board: { select: { slug: true } } },
    });
    if (!post) {
      throw new ActionError("postNotFound", "Post not found");
    }

    const session = await auth();
    if (!session?.user?.id || post.authorId !== session.user.id) {
      throw new ActionError("permissionDenied", "You can only edit your own posts");
    }

    const baseSlug = slugify(validTitle);
    if (!baseSlug) {
      throw new ActionError("invalidPostTitle", "Post title produces an invalid URL slug");
    }

    let slug = baseSlug;
    let suffix = 1;
    while (
      await prisma.post.findFirst({
        where: { boardId: post.boardId, slug, deletedAt: null, id: { not: postId } },
      })
    ) {
      slug = `${baseSlug}-${suffix++}`;
    }

    await prisma.post.update({
      where: { id: postId },
      data: { title: validTitle, slug, body: validBody },
    });

    revalidatePath(`/boards/${post.board.slug}`);
  },
);

export const togglePostPin = guardedAction("post:edit", "post:edit", async (postId: string) => {
  validateUUID(postId, "postId");

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { board: { select: { slug: true } } },
  });
  if (!post) {
    throw new ActionError("postNotFound", "Post not found");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { pinned: !post.pinned },
  });

  revalidatePath(`/boards/${post.board.slug}`);
});

export const deletePost = guardedAction("post:delete", "post:delete", async (postId: string) => {
  validateUUID(postId, "postId");

  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { board: { select: { slug: true } } },
  });
  if (!post) {
    throw new ActionError("postNotFound", "Post not found");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/boards/${post.board.slug}`);
});
