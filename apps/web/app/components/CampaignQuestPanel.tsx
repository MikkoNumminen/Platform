"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CloseIcon from "@mui/icons-material/Close";
import CampaignIcon from "@mui/icons-material/Campaign";
import { useSession } from "next-auth/react";
import { getActiveCampaign, type ActiveCampaign } from "@/lib/campaign-queries";
import CustomSurveyForm from "./survey/CustomSurveyForm";
import type { CustomQuestion } from "@/lib/custom-survey-config";
import { colors } from "../styles";

function formatDeadline(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 1) return `${days} days left`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 1) return `${hours} hours left`;
  return "Less than 1 hour";
}

export default function CampaignQuestPanel() {
  const { data: session } = useSession();
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setLoaded(true);
      return;
    }
    getActiveCampaign()
      .then(setCampaign)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [session?.user]);

  const isDemoUser = Boolean(
    (session?.user as { demoSessionId?: string } | undefined)?.demoSessionId,
  );
  if (!loaded || !campaign || isDemoUser) return null;

  const completedCount = campaign.quests.filter((q) => q.status === "completed").length;
  const totalCount = campaign.quests.length;
  const allComplete = completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalXp = campaign.quests.reduce((sum, q) => sum + q.xpReward, 0);

  // Check if survey was already submitted
  const surveySubmitted =
    typeof window !== "undefined" &&
    localStorage.getItem(`platform_survey_${campaign.roundId}`) === "true";

  if (allComplete) return null;

  const hasSurvey = campaign.customQuestions && campaign.customQuestions.length > 0;

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          width: { xs: 280, sm: 320 },
          maxHeight: expanded ? "80vh" : "auto",
          overflow: expanded ? "auto" : "hidden",
          border: `1px solid ${colors.cyan400}`,
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
              <CampaignIcon sx={{ fontSize: 18, color: colors.cyan400 }} />
              <Typography
                variant="subtitle2"
                sx={{ color: colors.slate100, fontWeight: 600, fontSize: "0.85rem" }}
              >
                {campaign.roundTitle}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.slate400 }}>
              {completedCount} of {totalCount} complete
              {campaign.deadline && ` · ${formatDeadline(campaign.deadline)}`}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${totalXp} XP`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: colors.accentBgSubtle,
                color: colors.cyan400,
              }}
            />
            <IconButton
              size="small"
              aria-label={expanded ? "Collapse" : "Expand"}
              sx={{ color: colors.slate400 }}
            >
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
              backgroundColor: colors.cyan400,
            },
          }}
        />

        {/* Expanded quest list */}
        <Collapse in={expanded}>
          <Box sx={{ p: 1.5, pt: 1 }}>
            {campaign.roundDescription && (
              <Typography
                variant="caption"
                sx={{ color: colors.slate400, display: "block", mb: 1 }}
              >
                {campaign.roundDescription}
              </Typography>
            )}

            {campaign.quests.map((quest) => {
              const done = quest.status === "completed";
              const isSurveyQuest = quest.title.startsWith("Complete Survey:");
              return (
                <Box
                  key={quest.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.3,
                    opacity: done ? 0.5 : 1,
                    cursor:
                      isSurveyQuest && !done && !surveySubmitted && hasSurvey
                        ? "pointer"
                        : "default",
                    "&:hover":
                      isSurveyQuest && !done && !surveySubmitted && hasSurvey
                        ? { opacity: 0.8 }
                        : {},
                  }}
                  onClick={() => {
                    if (isSurveyQuest && !done && !surveySubmitted && hasSurvey) {
                      setShowSurvey(true);
                    }
                  }}
                >
                  {done ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: colors.cyan400 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: colors.slate400 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.78rem",
                      color: done ? colors.slate400 : colors.slate100,
                      textDecoration: done ? "line-through" : "none",
                      flex: 1,
                    }}
                  >
                    {isSurveyQuest ? "Complete the feedback survey" : quest.title}
                  </Typography>
                  <Chip
                    label={`+${quest.xpReward}`}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: "0.6rem",
                      backgroundColor: colors.accentBgSubtle,
                      color: colors.cyan400,
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Collapse>
      </Paper>

      {/* Survey Dialog */}
      {hasSurvey && (
        <Dialog open={showSurvey} onClose={() => setShowSurvey(false)} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            {campaign.roundTitle}
            <IconButton
              size="small"
              aria-label="Close survey dialog"
              onClick={() => setShowSurvey(false)}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <CustomSurveyForm
              questions={campaign.customQuestions as CustomQuestion[]}
              roundId={campaign.roundId}
              roundTitle={campaign.roundTitle}
              onComplete={() => {
                setShowSurvey(false);
                // Refresh campaign state
                getActiveCampaign()
                  .then(setCampaign)
                  .catch(() => {});
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
