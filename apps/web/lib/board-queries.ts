import { prisma } from "./db";
import { getDemoSessionId } from "@/lib/demo-session";

export interface BoardListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export async function getBoards(): Promise<BoardListItem[]> {
  const sessionId = await getDemoSessionId();
  const boards = await prisma.board.findMany({
    where: { deletedAt: null, sessionId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { posts: { where: { deletedAt: null, sessionId } } },
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
  const sessionId = await getDemoSessionId();
  return prisma.board.findFirst({
    where: { slug, deletedAt: null, sessionId },
    select: { id: true, name: true, slug: true, description: true },
  });
}
