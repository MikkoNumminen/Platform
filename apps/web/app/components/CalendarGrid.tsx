"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { colors } from "../styles";
import type { CalendarEvent } from "../types/calendar";
import { EventChip, EventDetailDialog } from "./EventCard";
import EventFormDialog, { type EventFormData } from "./EventFormDialog";

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Return the Monday on or before the 1st of the given month. */
function getGridStart(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const dayOfWeek = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dayOfWeek);
  return start;
}

/** Build exactly 42 (6 * 7) dates starting from the grid start. */
function buildGridDates(year: number, month: number): Date[] {
  const start = getGridStart(year, month);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Server actions serialize Dates as strings — rehydrate them. */
function rehydrateEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.map((e) => ({
    ...e,
    startTime: new Date(e.startTime),
    endTime: new Date(e.endTime),
  }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CalendarGridProps {
  events: CalendarEvent[];
  onMonthChange?: (year: number, month: number) => Promise<CalendarEvent[]>;
  onCreateEvent?: (data: EventFormData) => Promise<{ error?: string; code?: string } | undefined>;
  onUpdateEvent?: (
    id: string,
    data: EventFormData,
  ) => Promise<{ error?: string; code?: string } | undefined>;
  onDeleteEvent?: (id: string) => Promise<{ error?: string; code?: string } | undefined>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function CalendarGrid({
  events: initialEvents,
  onMonthChange,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const dates = useMemo(() => buildGridDates(year, month), [year, month]);

  const refreshEvents = useCallback(
    async (y: number, m: number) => {
      if (!onMonthChange) return;
      const fetched = await onMonthChange(y, m);
      setEvents(rehydrateEvents(fetched));
    },
    [onMonthChange],
  );

  // Fetch events when month changes
  useEffect(() => {
    if (year === today.getFullYear() && month === today.getMonth()) {
      setEvents(initialEvents);
      return;
    }
    if (!onMonthChange) return;

    let cancelled = false;
    onMonthChange(year, month).then((fetched) => {
      if (!cancelled) setEvents(rehydrateEvents(fetched));
    });
    return () => {
      cancelled = true;
    };
  }, [year, month, onMonthChange, initialEvents, today]);

  /** Map day-string → events for O(1) lookup per cell. */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const key = `${evt.startTime.getFullYear()}-${evt.startTime.getMonth()}-${evt.startTime.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(evt);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const eventsForDate = useCallback(
    (d: Date) => eventsByDate.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [],
    [eventsByDate],
  );

  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleCreate = async (data: EventFormData) => {
    if (!onCreateEvent) return;
    const result = await onCreateEvent(data);
    if (result?.error) throw new Error(result.error);
    await refreshEvents(year, month);
  };

  const handleEdit = async (data: EventFormData) => {
    if (!onUpdateEvent || !editingEvent) return;
    const result = await onUpdateEvent(editingEvent.id, data);
    if (result?.error) throw new Error(result.error);
    setEditingEvent(null);
    await refreshEvents(year, month);
  };

  const handleDelete = async (event: CalendarEvent) => {
    if (!onDeleteEvent) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    await onDeleteEvent(event.id);
    await refreshEvents(year, month);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* ---- Month navigation header ---- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <IconButton
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          sx={{ color: colors.slate100 }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="h6"
            sx={{ color: colors.slate100, fontWeight: 600, userSelect: "none" }}
          >
            {formatMonthYear(year, month)}
          </Typography>
          {canCreate && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
              size="small"
              sx={{
                color: colors.green400,
                borderColor: colors.green400,
                "&:hover": { borderColor: colors.green400, backgroundColor: colors.hoverOverlay },
              }}
              variant="outlined"
            >
              Event
            </Button>
          )}
        </Box>

        <IconButton onClick={goToNextMonth} aria-label="Next month" sx={{ color: colors.slate100 }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* ---- Grid ---- */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          border: `1px solid ${colors.slate300}`,
          borderRadius: "6px",
          overflow: "hidden",
          backgroundColor: colors.slate700,
        }}
      >
        {/* Day-of-week header row */}
        {DAY_LABELS.map((label) => (
          <Box
            key={label}
            sx={{
              py: 1,
              textAlign: "center",
              backgroundColor: colors.slate600,
              borderBottom: `1px solid ${colors.slate300}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: colors.slate400,
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: { xs: "0.6rem", sm: "0.75rem" },
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}

        {/* Day cells */}
        {dates.map((date, idx) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = isSameDay(date, today);
          const dayEvents = eventsForDate(date);

          return (
            <Box
              key={date.toISOString().slice(0, 10)}
              sx={{
                minHeight: { xs: 56, sm: 90 },
                p: 0.5,
                borderRight: (idx + 1) % 7 !== 0 ? `1px solid ${colors.slate300}` : "none",
                borderBottom: idx < 35 ? `1px solid ${colors.slate300}` : "none",
                backgroundColor: isToday ? colors.hoverOverlay : "transparent",
                opacity: isCurrentMonth ? 1 : 0.35,
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
              }}
            >
              {/* Day number */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? colors.green400 : colors.slate100,
                  fontSize: { xs: "0.7rem", sm: "0.85rem" },
                  lineHeight: 1,
                  mb: 0.25,
                  width: isToday ? 24 : "auto",
                  height: isToday ? 24 : "auto",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isToday ? "center" : "flex-start",
                  backgroundColor: isToday ? colors.green900 : "transparent",
                }}
              >
                {date.getDate()}
              </Typography>

              {/* Event chips */}
              {dayEvents.map((evt) => (
                <EventChip key={evt.id} event={evt} onClick={setSelectedEvent} />
              ))}
            </Box>
          );
        })}
      </Box>

      {/* ---- Event detail dialog ---- */}
      <EventDetailDialog
        event={selectedEvent}
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        onEdit={(evt) => {
          setEditingEvent(evt);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* ---- Create / Edit form dialog ---- */}
      {formOpen && (
        <EventFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={editingEvent ? handleEdit : handleCreate}
          event={editingEvent}
        />
      )}
    </>
  );
}
