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
import { triggerGamification } from "@/lib/gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";

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
    const sessionId = await getDemoSessionId();

    await prisma.calendarEvent.create({
      data: {
        ...data,
        authorId: session.user.id,
        sessionId,
      },
    });

    await triggerGamification(session.user.id, "event:create");
  },
);

export const updateEvent = guardedAction(
  "event:edit",
  "event:edit",
  async (session, input: UpdateEventInput) => {
    validateUUID(input.id, "event ID");
    const data = validateEventInput(input);
    const sessionId = await getDemoSessionId();

    const existing = await prisma.calendarEvent.findFirst({
      where: { id: input.id, deletedAt: null, sessionId },
    });
    if (!existing) {
      throw new ActionError("eventNotFound", "Event not found");
    }

    if (existing.authorId !== session.user.id) {
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
    const sessionId = await getDemoSessionId();

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, deletedAt: null, sessionId },
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
