import { prisma } from "@/lib/db";

export async function getEvents(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return prisma.calendarEvent.findMany({
    where: {
      deletedAt: null,
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
  return prisma.calendarEvent.findFirst({
    where: { id, deletedAt: null },
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
