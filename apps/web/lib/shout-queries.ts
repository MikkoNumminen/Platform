import { prisma } from "./db";
import { getDemoSessionId } from "@/lib/demo-session";

export interface ShoutData {
  id: string;
  message: string;
  alias: string;
  role: string;
  developerTag: string | null;
  createdAt: string;
}

const SHOUT_LIMIT = 50;

export async function getRecentShouts(): Promise<ShoutData[]> {
  const sessionId = await getDemoSessionId();
  const shouts = await prisma.shout.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: SHOUT_LIMIT,
    include: { author: { select: { alias: true, name: true, role: true, developerTag: true } } },
  });

  return shouts.reverse().map((s) => ({
    id: s.id,
    message: s.message,
    alias: s.author.alias ?? s.author.name ?? "Unknown",
    role: s.author.role,
    developerTag: s.author.developerTag,
    createdAt: s.createdAt.toISOString(),
  }));
}
