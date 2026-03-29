import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";

export async function getEvents(year: number, month: number) {
  const sessionId = await getDemoSessionId();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return prisma.calendarEvent.findMany({
    where: {
      deletedAt: null,
      sessionId,
      startTime: { gte: start, lt: end },
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startTime: true,
      endTime: true,
      allDay: true,
      authorId: true,
      author: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getEventById(id: string) {
  const sessionId = await getDemoSessionId();
  return prisma.calendarEvent.findFirst({
    where: { id, deletedAt: null, sessionId },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startTime: true,
      endTime: true,
      allDay: true,
      authorId: true,
      author: {
        select: { id: true, name: true },
      },
    },
  });
}
