import { prisma } from "./db";
import { getTenantFilter } from "@/lib/tenant";

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
  const { tenant, sessionId } = await getTenantFilter();
  const shouts = await prisma.shout.findMany({
    where: { tenant, sessionId },
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
