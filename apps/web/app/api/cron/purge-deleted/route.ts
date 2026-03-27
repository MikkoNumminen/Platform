import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RETENTION_DAYS = 30;

/**
 * Purge soft-deleted records older than the retention period.
 * Intended to be called by a cron job (e.g. Vercel Cron).
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const [posts, topics, threads, boards, forums, users, events] = await Promise.all([
    prisma.post.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.topic.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.thread.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.board.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.forum.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.user.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    prisma.calendarEvent.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
  ]);

  const summary = {
    purgedBefore: cutoff.toISOString(),
    deleted: {
      posts: posts.count,
      topics: topics.count,
      threads: threads.count,
      boards: boards.count,
      forums: forums.count,
      users: users.count,
      calendarEvents: events.count,
    },
  };

  return NextResponse.json(summary);
}
