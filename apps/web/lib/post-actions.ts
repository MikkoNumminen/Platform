"use server";

import { prisma } from "./db";
import { guardedAction } from "./guardedAction";
import { ActionError } from "./actionErrors";
import { validateUUID, createStringValidator } from "./actionUtils";
import { revalidatePath } from "next/cache";
import { slugify } from "./slug-utils";
import { triggerGamification } from "./gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";

const validatePostTitle = createStringValidator(
  "Post title",
  200,
  "invalidPostTitle",
  "postTitleTooLong",
);
const validatePostBody = createStringValidator(
  "Post body",
  10000,
  "postBodyRequired",
  "postBodyRequired",
);

export const createPost = guardedAction(
  "post:create",
  "post:create",
  async (session, boardId: string, title: string, body: string) => {
    validateUUID(boardId, "boardId");
    const validTitle = validatePostTitle(title);
    const validBody = validatePostBody(body);
    const baseSlug = slugify(validTitle);
    const sessionId = await getDemoSessionId();

    if (!baseSlug) {
      throw new ActionError("invalidPostTitle", "Post title produces an invalid URL slug");
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, deletedAt: null, sessionId },
    });
    if (!board) {
      throw new ActionError("boardNotFound", "Board not found");
    }

    const authorId = session.user.id;

    // Ensure unique slug within board
    let slug = baseSlug;
    let suffix = 1;
    while (
      await prisma.post.findFirst({
        where: { boardId, slug, deletedAt: null, sessionId },
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
        sessionId,
      },
    });

    await triggerGamification(authorId, "post:create");

    revalidatePath(`/boards/${board.slug}`);
  },
);

export const updatePost = guardedAction(
  "post:edit",
  "post:edit",
  async (session, postId: string, title: string, body: string) => {
    validateUUID(postId, "postId");
    const validTitle = validatePostTitle(title);
    const validBody = validatePostBody(body);
    const sessionId = await getDemoSessionId();

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, sessionId },
      include: { board: { select: { slug: true } } },
    });
    if (!post) {
      throw new ActionError("postNotFound", "Post not found");
    }

    if (post.authorId !== session.user.id) {
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
        where: { boardId: post.boardId, slug, deletedAt: null, id: { not: postId }, sessionId },
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

export const togglePostPin = guardedAction(
  "post:edit",
  "post:edit",
  async (_session, postId: string) => {
    validateUUID(postId, "postId");
    const sessionId = await getDemoSessionId();

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, sessionId },
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
  },
);

export const deletePost = guardedAction(
  "post:delete",
  "post:delete",
  async (_session, postId: string) => {
    validateUUID(postId, "postId");
    const sessionId = await getDemoSessionId();

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, sessionId },
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
  },
);
