"use client";

import { Box, Chip, Divider, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UndoIcon from "@mui/icons-material/Undo";
import { colors } from "../styles";
import { resolveIssue } from "@/lib/issue-actions";
import type { IssueData } from "@/lib/issue-queries";

interface IssueListProps {
  open: IssueData[];
  resolved: IssueData[];
  canResolve: boolean;
}

function IssueCard({ issue, canResolve }: { issue: IssueData; canResolve: boolean }) {
  const handleResolve = async () => {
    await resolveIssue(issue.id);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: issue.resolved ? colors.slate700 : colors.slate600,
        border: `1px solid ${colors.slate300}`,
        borderRadius: "4px",
        opacity: issue.resolved ? 0.7 : 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ color: colors.slate100 }}>
              {issue.title}
            </Typography>
            {issue.resolved && (
              <Chip
                label="Resolved"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  backgroundColor: colors.success,
                  color: "#fff",
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: colors.slate300, whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 1 }}
          >
            {issue.description}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ color: colors.slate400 }}>
              {issue.authorAlias} &middot;{" "}
              {issue.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
            {issue.url && (
              <Typography variant="caption" sx={{ color: colors.green400 }}>
                {issue.url}
              </Typography>
            )}
          </Box>
        </Box>
        {canResolve && (
          <Tooltip title={issue.resolved ? "Reopen" : "Mark resolved"}>
            <IconButton onClick={handleResolve} size="small" sx={{ color: colors.green400 }}>
              {issue.resolved ? (
                <UndoIcon fontSize="small" />
              ) : (
                <CheckCircleIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
}

export default function IssueList({ open, resolved, canResolve }: IssueListProps) {
  return (
    <Box>
      {open.length > 0 && (
        <>
          <Typography variant="overline" sx={{ color: colors.slate400 }}>
            Open ({open.length})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
            {open.map((issue) => (
              <IssueCard key={issue.id} issue={issue} canResolve={canResolve} />
            ))}
          </Box>
        </>
      )}

      {resolved.length > 0 && (
        <>
          {open.length > 0 && <Divider sx={{ mb: 2, borderColor: colors.slate300 }} />}
          <Typography variant="overline" sx={{ color: colors.slate400 }}>
            Resolved ({resolved.length})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {resolved.map((issue) => (
              <IssueCard key={issue.id} issue={issue} canResolve={canResolve} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
