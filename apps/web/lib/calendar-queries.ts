import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";

export async function getEvents(year: number, month: number) {
  const { tenant, sessionId } = await getTenantFilter();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return prisma.calendarEvent.findMany({
    where: {
      deletedAt: null,
      tenant,
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
  const { tenant, sessionId } = await getTenantFilter();
  return prisma.calendarEvent.findFirst({
    where: { id, deletedAt: null, tenant, sessionId },
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
