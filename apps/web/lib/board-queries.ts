import { prisma } from "./db";

export interface BoardListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export async function getBoards(): Promise<BoardListItem[]> {
  const boards = await prisma.board.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { posts: { where: { deletedAt: null } } },
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
  return prisma.board.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true, description: true },
  });
}
