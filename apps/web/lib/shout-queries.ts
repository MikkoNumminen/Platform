import { prisma } from "./db";

export interface ShoutData {
  id: string;
  message: string;
  alias: string;
  createdAt: string;
}

const SHOUT_LIMIT = 50;

export async function getRecentShouts(): Promise<ShoutData[]> {
  const shouts = await prisma.shout.findMany({
    orderBy: { createdAt: "desc" },
    take: SHOUT_LIMIT,
    include: { author: { select: { alias: true, name: true } } },
  });

  return shouts.reverse().map((s) => ({
    id: s.id,
    message: s.message,
    alias: s.author.alias ?? s.author.name ?? "Unknown",
    createdAt: s.createdAt.toISOString(),
  }));
}
