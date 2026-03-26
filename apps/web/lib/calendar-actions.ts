"use server";

import { auth } from "@/auth";
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

export async function fetchEvents(
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
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
  async (input: CreateEventInput) => {
    const session = await auth();
    const data = validateEventInput(input);

    await prisma.calendarEvent.create({
      data: {
        ...data,
        authorId: session!.user!.id as string,
      },
    });
  },
);

export const updateEvent = guardedAction(
  "event:edit",
  "event:edit",
  async (input: UpdateEventInput) => {
    validateUUID(input.id, "event ID");
    const data = validateEventInput(input);

    const existing = await prisma.calendarEvent.findFirst({
      where: { id: input.id, deletedAt: null },
    });
    if (!existing) {
      throw new ActionError("eventNotFound", "Event not found");
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
  async (id: string) => {
    validateUUID(id, "event ID");

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, deletedAt: null },
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
