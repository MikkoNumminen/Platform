import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { getTenantFilter } from "@/lib/tenant";

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  pinned: boolean;
  authorName: string;
  createdAt: Date;
}

const fetchPostsByBoard = unstable_cache(
  async (boardId: string, tenant: string, sessionId: string | null): Promise<PostListItem[]> => {
    const posts = await prisma.post.findMany({
      where: { boardId, deletedAt: null, tenant, sessionId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
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
  },
  ["posts-by-board"],
  { revalidate: 60, tags: ["posts"] },
);

export async function getPostsByBoard(boardId: string): Promise<PostListItem[]> {
  const { tenant, sessionId } = await getTenantFilter();
  return fetchPostsByBoard(boardId, tenant, sessionId);
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

const fetchPostBySlug = unstable_cache(
  async (
    boardId: string,
    postSlug: string,
    tenant: string,
    sessionId: string | null,
  ): Promise<PostDetail | null> => {
    const post = await prisma.post.findFirst({
      where: { boardId, slug: postSlug, deletedAt: null, tenant, sessionId },
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
  },
  ["post-by-slug"],
  { revalidate: 60, tags: ["posts"] },
);

export async function getPostBySlug(boardId: string, postSlug: string): Promise<PostDetail | null> {
  const { tenant, sessionId } = await getTenantFilter();
  return fetchPostBySlug(boardId, postSlug, tenant, sessionId);
}
