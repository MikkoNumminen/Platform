"use client";

import { Box, Typography } from "@mui/material";
import { colors } from "../styles";
import type { CommitEntry } from "@/lib/github-commits";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusColor(status: CommitEntry["status"]): string {
  if (status === "success") return colors.green400;
  if (status === "failure") return colors.error;
  if (status === "pending") return colors.warning;
  return colors.slate400;
}

function statusDot(status: CommitEntry["status"]): string {
  if (status === "success") return "\u25cf"; // ●
  if (status === "failure") return "\u25cf";
  if (status === "pending") return "\u25cb"; // ○
  return "\u25cb";
}

interface DevLogProps {
  commits: CommitEntry[];
}

export default function DevLog({ commits }: DevLogProps) {
  return (
    <Box
      sx={{
        backgroundColor: colors.slate700,
        border: `1px solid ${colors.slate300}`,
        borderRadius: "4px",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${colors.slate300}`,
          backgroundColor: colors.slate600,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: colors.slate400, fontFamily: "inherit", fontWeight: 600 }}
        >
          Dev Log
        </Typography>
      </Box>

      <Box
        sx={{
          maxHeight: 300,
          overflowY: "auto",
          px: 1.5,
          py: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colors.slate400,
            borderRadius: 3,
          },
        }}
      >
        {commits.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: colors.slate400, fontFamily: "inherit", fontStyle: "italic" }}
          >
            No commits loaded.
          </Typography>
        ) : (
          commits.map((commit) => (
            <Box key={commit.sha} sx={{ display: "flex", gap: 0.75, lineHeight: 1.6 }}>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: statusColor(commit.status),
                  fontFamily: "inherit",
                  flexShrink: 0,
                  fontSize: "0.8rem",
                }}
              >
                {statusDot(commit.status)}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: colors.slate400,
                  fontFamily: "inherit",
                  flexShrink: 0,
                  fontSize: "0.75rem",
                  minWidth: "4.5em",
                }}
              >
                {formatRelativeTime(commit.date)}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: commit.status === "failure" ? colors.error : colors.slate100,
                  fontFamily: "inherit",
                  wordBreak: "break-word",
                  fontSize: "0.8rem",
                  fontWeight: commit.status === "failure" ? 600 : 400,
                }}
              >
                {commit.message}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
