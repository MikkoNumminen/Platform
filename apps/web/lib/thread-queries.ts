import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { getTenantFilter } from "@/lib/tenant";
import type { ThreadData } from "@/app/types/thread";

interface FlatThread {
  id: string;
  body: string;
  authorName: string;
  createdAt: Date;
  replyToId: string | null;
}

const fetchThreadsByParent = unstable_cache(
  async (
    parentType: "POST" | "TOPIC",
    parentId: string,
    tenant: string,
    sessionId: string | null,
  ): Promise<ThreadData[]> => {
    const flat = await prisma.thread.findMany({
      where: { parentType, parentId, deletedAt: null, tenant, sessionId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { alias: true, name: true } } },
    });

    const threads: FlatThread[] = flat.map((t) => ({
      id: t.id,
      body: t.body,
      authorName: t.author.alias ?? t.author.name ?? "Unknown",
      createdAt: t.createdAt,
      replyToId: t.replyToId,
    }));

    return buildTree(threads);
  },
  ["threads-by-parent"],
  { revalidate: 60, tags: ["threads"] },
);

export async function getThreadsByParent(
  parentType: "POST" | "TOPIC",
  parentId: string,
): Promise<ThreadData[]> {
  const { tenant, sessionId } = await getTenantFilter();
  return fetchThreadsByParent(parentType, parentId, tenant, sessionId);
}

function buildTree(flat: FlatThread[]): ThreadData[] {
  const map = new Map<string, ThreadData>();
  const roots: ThreadData[] = [];

  for (const t of flat) {
    map.set(t.id, {
      id: t.id,
      body: t.body,
      authorName: t.authorName,
      createdAt: t.createdAt.toISOString(),
      replies: [],
    });
  }

  for (const t of flat) {
    const node = map.get(t.id);
    if (!node) continue;
    if (t.replyToId) {
      const parent = map.get(t.replyToId);
      if (parent) {
        parent.replies.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  return roots;
}
