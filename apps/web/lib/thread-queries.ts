import { prisma } from "./db";
import { getDemoSessionId } from "@/lib/demo-session";
import type { ThreadData } from "@/app/types/thread";

interface FlatThread {
  id: string;
  body: string;
  authorName: string;
  createdAt: Date;
  replyToId: string | null;
}

export async function getThreadsByParent(
  parentType: "POST" | "TOPIC",
  parentId: string,
): Promise<ThreadData[]> {
  const sessionId = await getDemoSessionId();
  const flat = await prisma.thread.findMany({
    where: { parentType, parentId, deletedAt: null, sessionId },
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
