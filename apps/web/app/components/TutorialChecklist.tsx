"use client";

import { useState } from "react";
import { Box, Chip, Collapse, IconButton, LinearProgress, Paper, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ScienceIcon from "@mui/icons-material/Science";
import { useTutorialMaybe } from "./TutorialProvider";
import { TIER_NAMES } from "@/lib/tutorial/tutorial-config";
import { colors } from "../styles";

const STEP_LABELS: Record<string, string> = {
  set_alias: "Set your alias",
  complete_survey: "Complete the survey",
  report_issue: "Report an issue",
  explore_home: "Explore the homepage",
  write_comment: "Write a comment",
  check_quests: "Check your quest log",
  view_achievements: "View achievements",
  check_leaderboard: "Check the leaderboard",
  view_survey_results: "View feedback & survey results",
  view_gamification_dashboard: "View Vuohiliitto dashboard",
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
        width: { xs: 280, sm: 320 },
        maxHeight: expanded ? "80vh" : "auto",
        overflow: expanded ? "auto" : "hidden",
        border: `1px solid ${colors.accentBorder}`,
        backgroundColor: colors.backdrop,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: colors.slate100, fontWeight: 600, fontSize: "0.85rem" }}
            >
              Guided Tour
            </Typography>
            <Chip
              icon={<ScienceIcon sx={{ fontSize: 12 }} />}
              label="Beta"
              size="small"
              sx={{
                height: 18,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                backgroundColor: colors.surfaceOverlay,
                color: colors.warning,
                "& .MuiChip-icon": { color: colors.warning, ml: 0.5 },
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: colors.slate400 }}>
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
              backgroundColor: colors.accentBorder,
              color: colors.green400,
            }}
          />
          <IconButton size="small" sx={{ color: colors.slate400 }}>
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
          backgroundColor: colors.surfaceOverlay,
          "& .MuiLinearProgress-bar": {
            background: colors.progressGradient,
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
                    color: colors.green400,
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
                        <CheckCircleIcon sx={{ fontSize: 16, color: colors.green400 }} />
                      ) : (
                        <RadioButtonUncheckedIcon
                          sx={{
                            fontSize: 16,
                            color: isCurrent ? colors.green400 : colors.slate400,
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.78rem",
                          color: done
                            ? colors.slate500
                            : isCurrent
                              ? colors.slate100
                              : colors.slate400,
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
                            backgroundColor: colors.accentBgSubtle,
                            color: colors.green400,
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
