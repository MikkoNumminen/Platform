import { Box } from "@mui/material";
import TopBar from "../components/TopBar";
import CalendarGrid from "../components/CalendarGrid";
import { getEvents } from "@/lib/calendar-queries";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/calendar-actions";
import { auth } from "@/auth";
import type { CalendarEvent } from "../types/calendar";
import type { CreateEventInput, UpdateEventInput } from "@/lib/calendar-schemas";

async function handleCreateEvent(data: {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}) {
  "use server";
  const input: CreateEventInput = {
    title: data.title,
    description: data.description || undefined,
    location: data.location || undefined,
    startTime: data.startTime,
    endTime: data.endTime,
    allDay: data.allDay,
  };
  return createEvent(input);
}

async function handleUpdateEvent(
  id: string,
  data: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
  },
) {
  "use server";
  const input: UpdateEventInput = {
    id,
    title: data.title,
    description: data.description || undefined,
    location: data.location || undefined,
    startTime: data.startTime,
    endTime: data.endTime,
    allDay: data.allDay,
  };
  return updateEvent(input);
}

async function handleDeleteEvent(id: string) {
  "use server";
  return deleteEvent(id);
}

export default async function CalendarPage() {
  const now = new Date();
  const dbEvents = await getEvents(now.getFullYear(), now.getMonth());
  const session = await auth();

  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};

  const events: CalendarEvent[] = dbEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startTime: e.startTime,
    endTime: e.endTime,
    allDay: e.allDay,
    authorId: e.authorId,
  }));

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 } }}>
      <TopBar title="Calendar" />
      <CalendarGrid
        events={events}
        onMonthChange={fetchEvents}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        canCreate={Boolean(permissions["event:create"])}
        canEdit={Boolean(permissions["event:edit"])}
        canDelete={Boolean(permissions["event:delete"])}
      />
    </Box>
  );
}
