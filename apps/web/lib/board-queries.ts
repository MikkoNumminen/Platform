import { prisma } from "./db";
import { getTenantFilter } from "@/lib/tenant";

export interface BoardListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export async function getBoards(): Promise<BoardListItem[]> {
  const { tenant, sessionId } = await getTenantFilter();
  const boards = await prisma.board.findMany({
    where: { deletedAt: null, tenant, sessionId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { posts: { where: { deletedAt: null, tenant, sessionId } } },
      },
    },
  });

  return boards.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    postCount: b._count.posts,
  }));
}

export interface BoardDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export async function getBoardBySlug(slug: string): Promise<BoardDetail | null> {
  const { tenant, sessionId } = await getTenantFilter();
  return prisma.board.findFirst({
    where: { slug, deletedAt: null, tenant, sessionId },
    select: { id: true, name: true, slug: true, description: true },
  });
}
