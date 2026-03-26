"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { colors } from "../styles";
import type { CalendarEvent } from "../types/calendar";

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  event?: CalendarEvent | null;
  defaultDate?: Date;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalDateString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const dialogPaperSx = {
  backgroundColor: colors.slate700,
  border: `1px solid ${colors.slate300}`,
  borderRadius: "8px",
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: colors.slate100,
    "& fieldset": { borderColor: colors.slate300 },
    "&:hover fieldset": { borderColor: colors.slate400 },
    "&.Mui-focused fieldset": { borderColor: colors.green400 },
  },
  "& .MuiInputLabel-root": { color: colors.slate400 },
  "& .MuiInputLabel-root.Mui-focused": { color: colors.green400 },
};

export default function EventFormDialog({
  open,
  onClose,
  onSubmit,
  event,
  defaultDate,
}: EventFormDialogProps) {
  const isEdit = Boolean(event);
  const now = defaultDate ?? new Date();

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startTime, setStartTime] = useState(
    event ? toLocalDateTimeString(event.startTime) : toLocalDateTimeString(now),
  );
  const [endTime, setEndTime] = useState(
    event
      ? toLocalDateTimeString(event.endTime)
      : toLocalDateTimeString(new Date(now.getTime() + 3600_000)),
  );
  const [startDate, setStartDate] = useState(
    event ? toLocalDateString(event.startTime) : toLocalDateString(now),
  );
  const [endDate, setEndDate] = useState(
    event ? toLocalDateString(event.endTime) : toLocalDateString(now),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        location,
        startTime: allDay ? `${startDate}T00:00:00` : startTime,
        endTime: allDay ? `${endDate}T23:59:59` : endTime,
        allDay,
      });
      onClose();
    } catch {
      setError("Failed to save event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogTitle sx={{ color: colors.green400, fontWeight: 600 }}>
        {isEdit ? "Edit Event" : "Create Event"}
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={textFieldSx}
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={textFieldSx}
        />

        <TextField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          fullWidth
          sx={textFieldSx}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              sx={{ color: colors.slate400, "&.Mui-checked": { color: colors.green400 } }}
            />
          }
          label="All day"
          sx={{ color: colors.slate100 }}
        />

        {allDay ? (
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
            />
            <TextField
              label="End Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
            />
          </Box>
        )}

        {error && <Box sx={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</Box>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: colors.slate400 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          variant="contained"
          sx={{
            backgroundColor: colors.green400,
            color: colors.slate700,
            "&:hover": { backgroundColor: colors.green400 },
            "&:disabled": { backgroundColor: colors.slate300 },
          }}
        >
          {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
