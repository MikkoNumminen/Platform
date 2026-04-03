"use client";

import { Chip } from "@mui/material";
import { colors, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from "../styles";

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={STATUS_LABELS[status] ?? status}
      size="small"
      sx={{
        height: 20,
        fontSize: "0.65rem",
        fontWeight: 600,
        backgroundColor: "transparent",
        color: STATUS_COLORS[status] ?? colors.slate400,
        border: `1px solid ${STATUS_COLORS[status] ?? colors.slate400}`,
      }}
    />
  );
}

export function PriorityChip({ priority }: { priority: string }) {
  return (
    <Chip
      label={PRIORITY_LABELS[priority] ?? priority}
      size="small"
      sx={{
        height: 20,
        fontSize: "0.65rem",
        backgroundColor: "transparent",
        color: PRIORITY_COLORS[priority] ?? colors.slate400,
        border: `1px solid ${PRIORITY_COLORS[priority] ?? colors.slate400}`,
      }}
    />
  );
}

export function XpChip({ xp }: { xp: number }) {
  return (
    <Chip
      label={`+${xp} XP`}
      size="small"
      sx={{
        height: 20,
        fontSize: "0.65rem",
        fontWeight: 600,
        backgroundColor: colors.accentBgSubtle,
        color: colors.green400,
      }}
    />
  );
}
