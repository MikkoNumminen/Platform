"use client";

import { useState } from "react";
import { Box, Chip, Collapse, IconButton, LinearProgress, Paper, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useTutorialMaybe } from "./TutorialProvider";
import { TIER_NAMES } from "@/lib/tutorial/tutorial-config";

const STEP_LABELS: Record<string, string> = {
  set_alias: "Set your alias",
  complete_survey: "Complete the survey",
  report_issue: "Report an issue",
  explore_home: "Explore the homepage",
  browse_boards: "Browse the boards",
  create_post: "Create your first post",
  write_comment: "Write a comment",
  check_quests: "Check your quest log",
  view_achievements: "View achievements",
  check_leaderboard: "Check the leaderboard",
  create_board: "Create a board",
  view_survey_results: "View survey results",
  view_gamification_dashboard: "View gamification stats",
  resolve_issue: "Resolve an issue",
  manage_users: "Open user management",
  approve_user: "Approve a pending user",
  edit_permissions: "Edit user permissions",
};

export default function TutorialChecklist() {
  const ctx = useTutorialMaybe();
  const [expanded, setExpanded] = useState(false);

  if (!ctx?.isActive || ctx.allComplete) return null;

  const progressPercent =
    ctx.totalSteps > 0 ? Math.round((ctx.completedCount / ctx.totalSteps) * 100) : 0;

  // Group steps by tier
  const tiers = [1, 2, 3, 4].filter((tier) => ctx.steps.some((s) => s.tier === tier));

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: { xs: 8, sm: 16 },
        right: { xs: 8, sm: 16 },
        zIndex: 1100,
        width: { xs: 280, sm: 320 },
        maxHeight: expanded ? "80vh" : "auto",
        overflow: expanded ? "auto" : "hidden",
        border: "1px solid rgba(74, 222, 128, 0.2)",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1.5,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}
          >
            Guided Tour
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            {ctx.completedCount} of {ctx.totalSteps} complete
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`${progressPercent}%`}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.7rem",
              fontWeight: 700,
              backgroundColor: "rgba(74, 222, 128, 0.2)",
              color: "#4ade80",
            }}
          />
          <IconButton size="small" sx={{ color: "#94a3b8" }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{
          height: 3,
          backgroundColor: "rgba(255,255,255,0.05)",
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #4ade80, #22d3ee)",
          },
        }}
      />

      {/* Expanded step list */}
      <Collapse in={expanded}>
        <Box sx={{ p: 1.5, pt: 1 }}>
          {tiers.map((tier) => {
            const tierSteps = ctx.steps.filter((s) => s.tier === tier);
            return (
              <Box key={tier} sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#4ade80",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontSize: "0.65rem",
                  }}
                >
                  {TIER_NAMES[tier] ?? `Tier ${tier}`}
                </Typography>
                {tierSteps.map((step) => {
                  const done = ctx.completedSteps.has(step.id);
                  const isCurrent = ctx.currentStep?.id === step.id;
                  return (
                    <Box
                      key={step.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 0.3,
                        opacity: done ? 0.5 : 1,
                      }}
                    >
                      {done ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: "#4ade80" }} />
                      ) : (
                        <RadioButtonUncheckedIcon
                          sx={{
                            fontSize: 16,
                            color: isCurrent ? "#4ade80" : "#475569",
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.78rem",
                          color: done ? "#64748b" : isCurrent ? "#fff" : "#94a3b8",
                          textDecoration: done ? "line-through" : "none",
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        {STEP_LABELS[step.id] ?? step.id}
                      </Typography>
                      {isCurrent && (
                        <Chip
                          label="+10 XP"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: "0.6rem",
                            ml: "auto",
                            backgroundColor: "rgba(74,222,128,0.15)",
                            color: "#4ade80",
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}
