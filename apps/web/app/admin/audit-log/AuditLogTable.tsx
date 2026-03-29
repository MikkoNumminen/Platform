"use client";

import { useState, useMemo } from "react";
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import DataTable, { type Column } from "../../components/DataTable";
import { colors } from "../../styles";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string;
  actorName: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  total: number;
  actionTypes: string[];
}

const ACTION_COLORS: Record<string, string> = {
  create: colors.success,
  update: colors.info,
  delete: colors.error,
  complete: colors.green400,
  resolve: colors.success,
  unresolve: colors.warning,
  close: colors.warning,
  deleteAccount: colors.error,
  exportData: colors.info,
  updateRole: colors.cyan400,
  setDeveloperTag: colors.cyan400,
  updatePermissions: colors.cyan400,
};

function getActionColor(action: string): string {
  const verb = action.split(".")[1] ?? action;
  return ACTION_COLORS[verb] ?? colors.slate400;
}

function formatAction(action: string): string {
  return action.replace(".", " → ");
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function renderDetails(details: Record<string, unknown> | null): string {
  if (!details) return "";

  const parts: string[] = [];

  if (details.oldValues && details.newValues) {
    const oldVals = details.oldValues as Record<string, unknown>;
    const newVals = details.newValues as Record<string, unknown>;
    for (const key of Object.keys(newVals)) {
      parts.push(`${key}: ${String(oldVals[key] ?? "—")} → ${String(newVals[key] ?? "—")}`);
    }
  } else if (details.changes) {
    const changes = details.changes as Record<string, unknown>;
    for (const [key, val] of Object.entries(changes)) {
      if (val !== undefined) parts.push(`${key}: ${String(val)}`);
    }
  } else {
    for (const [key, val] of Object.entries(details)) {
      if (key === "oldValues" || key === "newValues" || key === "changes") continue;
      if (val !== undefined && val !== null) parts.push(`${key}: ${String(val)}`);
    }
  }

  return parts.join(", ");
}

export default function AuditLogTable({ logs, total, actionTypes }: AuditLogTableProps) {
  const [actionFilter, setActionFilter] = useState<string>("");

  const filteredLogs = useMemo(() => {
    if (!actionFilter) return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  const columns: Column<AuditLogEntry>[] = [
    {
      id: "createdAt",
      label: "When",
      accessor: (row) => new Date(row.createdAt),
      render: (row) => (
        <Typography
          variant="caption"
          sx={{ color: colors.slate400, whiteSpace: "nowrap" }}
          title={new Date(row.createdAt).toLocaleString()}
        >
          {formatTimeAgo(row.createdAt)}
        </Typography>
      ),
      searchable: false,
    },
    {
      id: "actorName",
      label: "Who",
      accessor: (row) => row.actorName ?? row.actorId.slice(0, 8),
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.actorName ?? row.actorId.slice(0, 8)}
        </Typography>
      ),
    },
    {
      id: "action",
      label: "Action",
      accessor: (row) => row.action,
      render: (row) => (
        <Chip
          label={formatAction(row.action)}
          size="small"
          sx={{
            height: 22,
            fontSize: "0.7rem",
            fontWeight: 600,
            color: getActionColor(row.action),
            borderColor: getActionColor(row.action),
            backgroundColor: "transparent",
            border: `1px solid`,
          }}
        />
      ),
    },
    {
      id: "entityType",
      label: "Target",
      accessor: (row) => row.entityType,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            {row.entityType}
          </Typography>
          {row.entityId && (
            <Typography variant="caption" sx={{ color: colors.slate400, fontFamily: "monospace" }}>
              {row.entityId.slice(0, 8)}…
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "details",
      label: "Details",
      accessor: (row) => renderDetails(row.details),
      render: (row) => {
        // eslint-disable-next-line testing-library/render-result-naming-convention
        const detailText = renderDetails(row.details);
        if (!detailText) return null;
        return (
          <Typography
            variant="caption"
            sx={{
              color: colors.slate400,
              maxWidth: 400,
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={detailText}
          >
            {detailText}
          </Typography>
        );
      },
      sortable: false,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="body2" sx={{ color: colors.slate400 }}>
          {total} total entries
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: colors.slate400 }}>Filter by action</InputLabel>
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            label="Filter by action"
            sx={{
              color: colors.slate100,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate400 },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.slate300 },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.green400,
              },
            }}
          >
            <MenuItem value="">All actions</MenuItem>
            {actionTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {formatAction(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        rows={filteredLogs}
        keyAccessor={(row) => row.id}
        defaultSortColumn="createdAt"
        defaultSortDirection="desc"
        searchPlaceholder="Search by name, entity, or details..."
        pageSize={25}
        emptyMessage="No audit log entries yet."
      />
    </Box>
  );
}
