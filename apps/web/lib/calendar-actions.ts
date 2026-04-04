"use server";

import { prisma } from "@/lib/db";
import { guardedAction } from "@/lib/guardedAction";
import { ActionError } from "@/lib/actionErrors";
import { validateUUID } from "@/lib/actionUtils";
import { getEvents } from "./calendar-queries";
import type { CalendarEvent } from "@/app/types/calendar";
import {
  validateEventInput,
  type CreateEventInput,
  type UpdateEventInput,
} from "./calendar-schemas";
import { getTenantFilter } from "@/lib/tenant";

export async function fetchEvents(year: number, month: number): Promise<CalendarEvent[]> {
  const dbEvents = await getEvents(year, month);
  return dbEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startTime: e.startTime,
    endTime: e.endTime,
    allDay: e.allDay,
    authorId: e.authorId,
  }));
}

export const createEvent = guardedAction(
  "event:create",
  "event:create",
  async (session, input: CreateEventInput) => {
    const data = validateEventInput(input);
    const { tenant, sessionId } = await getTenantFilter();

    await prisma.calendarEvent.create({
      data: {
        ...data,
        authorId: session.user.id,
        tenant,
        sessionId,
      },
    });

    // Calendar events don't award XP (feature is in backlog)
  },
);

export const updateEvent = guardedAction(
  "event:edit",
  "event:edit",
  async (session, input: UpdateEventInput) => {
    validateUUID(input.id, "event ID");
    const data = validateEventInput(input);
    const { tenant, sessionId } = await getTenantFilter();

    const existing = await prisma.calendarEvent.findFirst({
      where: { id: input.id, deletedAt: null, tenant, sessionId },
    });
    if (!existing) {
      throw new ActionError("eventNotFound", "Event not found");
    }

    const role = session.user.role ?? "pending";
    const isAdmin = ["superuser", "vuohi", "admin"].includes(role);
    if (existing.authorId !== session.user.id && !isAdmin) {
      throw new ActionError("permissionDenied", "You can only edit your own events");
    }

    await prisma.calendarEvent.update({
      where: { id: input.id },
      data,
    });
  },
);

export const deleteEvent = guardedAction(
  "event:delete",
  "event:delete",
  async (_session, id: string) => {
    validateUUID(id, "event ID");
    const { tenant, sessionId } = await getTenantFilter();

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, deletedAt: null, tenant, sessionId },
    });
    if (!existing) {
      throw new ActionError("eventNotFound", "Event not found");
    }

    await prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
);
