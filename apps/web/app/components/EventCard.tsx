"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { colors } from "../styles";
import type { CalendarEvent } from "../data/mockEvents";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateRange(event: CalendarEvent): string {
  if (event.allDay) return "All day";
  return `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`;
}

/* ------------------------------------------------------------------ */
/*  Chip variant — compact badge used inside calendar cells            */
/* ------------------------------------------------------------------ */

interface EventChipProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
}

export function EventChip({ event, onClick }: EventChipProps) {
  return (
    <Chip
      label={event.title}
      size="small"
      onClick={() => onClick(event)}
      sx={{
        maxWidth: "100%",
        height: 20,
        fontSize: "0.68rem",
        fontWeight: 500,
        backgroundColor: event.allDay ? colors.green900 : colors.slate600,
        color: event.allDay ? colors.green400 : colors.slate100,
        border: `1px solid ${event.allDay ? colors.green400 : colors.slate300}`,
        borderRadius: "4px",
        cursor: "pointer",
        "& .MuiChip-label": {
          px: 0.75,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        "&:hover": {
          opacity: 0.85,
        },
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Detail dialog — full information shown when an event is clicked    */
/* ------------------------------------------------------------------ */

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export function EventDetailDialog({ event, open, onClose }: EventDetailDialogProps) {
  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.slate300}`,
          borderRadius: "8px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: colors.green400,
          fontWeight: 600,
          pb: 0.5,
        }}
      >
        {event.title}
        <IconButton onClick={onClose} size="small" sx={{ color: colors.slate400 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: colors.slate400 }} />
          <Typography variant="body2" sx={{ color: colors.slate100 }}>
            {formatDateRange(event)}
          </Typography>
        </Box>

        {event.location && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <PlaceIcon sx={{ fontSize: 18, color: colors.slate400 }} />
            <Typography variant="body2" sx={{ color: colors.slate100 }}>
              {event.location}
            </Typography>
          </Box>
        )}

        <Typography
          variant="body2"
          sx={{ color: colors.slate400, lineHeight: 1.7, mt: 1 }}
        >
          {event.description}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Full card variant — for list / detail views                        */
/* ------------------------------------------------------------------ */

interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  return (
    <Card
      onClick={() => onClick?.(event)}
      sx={{
        backgroundColor: colors.slate700,
        border: `1px solid ${colors.slate300}`,
        borderRadius: "6px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s ease",
        "&:hover": onClick
          ? { borderColor: colors.green400 }
          : undefined,
      }}
      elevation={0}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography
          variant="subtitle2"
          sx={{ color: colors.green400, fontWeight: 600, mb: 0.5 }}
        >
          {event.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: colors.slate400 }} />
          <Typography variant="caption" sx={{ color: colors.slate100 }}>
            {formatDateRange(event)}
          </Typography>
        </Box>

        {event.location && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <PlaceIcon sx={{ fontSize: 14, color: colors.slate400 }} />
            <Typography variant="caption" sx={{ color: colors.slate100 }}>
              {event.location}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
