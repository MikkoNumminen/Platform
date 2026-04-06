import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { getTenantFilter } from "@/lib/tenant";

export interface BoardListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

const fetchBoards = unstable_cache(
  async (tenant: string, sessionId: string | null): Promise<BoardListItem[]> => {
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
  },
  ["boards"],
  { revalidate: 300, tags: ["boards"] },
);

export async function getBoards(): Promise<BoardListItem[]> {
  const { tenant, sessionId } = await getTenantFilter();
  return fetchBoards(tenant, sessionId);
}

export interface BoardDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const fetchBoardBySlug = unstable_cache(
  async (slug: string, tenant: string, sessionId: string | null): Promise<BoardDetail | null> => {
    return prisma.board.findFirst({
      where: { slug, deletedAt: null, tenant, sessionId },
      select: { id: true, name: true, slug: true, description: true },
    });
  },
  ["board-by-slug"],
  { revalidate: 300, tags: ["boards"] },
);

export async function getBoardBySlug(slug: string): Promise<BoardDetail | null> {
  const { tenant, sessionId } = await getTenantFilter();
  return fetchBoardBySlug(slug, tenant, sessionId);
}
