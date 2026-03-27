import { prisma } from "./db";

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  pinned: boolean;
  authorName: string;
  createdAt: Date;
}

export async function getPostsByBoard(boardId: string): Promise<PostListItem[]> {
  const posts = await prisma.post.findMany({
    where: { boardId, deletedAt: null },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { alias: true, name: true } } },
  });

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    pinned: p.pinned,
    authorName: p.author.alias ?? p.author.name ?? "Unknown",
    createdAt: p.createdAt,
  }));
}

export interface PostDetail {
  id: string;
  title: string;
  slug: string;
  body: string;
  pinned: boolean;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export async function getPostBySlug(boardId: string, postSlug: string): Promise<PostDetail | null> {
  const post = await prisma.post.findFirst({
    where: { boardId, slug: postSlug, deletedAt: null },
    include: { author: { select: { alias: true, name: true } } },
  });

  if (!post) return null;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    body: post.body,
    pinned: post.pinned,
    authorId: post.authorId,
    authorName: post.author.alias ?? post.author.name ?? "Unknown",
    createdAt: post.createdAt,
  };
}
