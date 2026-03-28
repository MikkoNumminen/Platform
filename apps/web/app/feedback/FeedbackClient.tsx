"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import StarIcon from "@mui/icons-material/Star";
import type { SurveyRoundData } from "@/lib/survey-round-queries";
import type { SurveyResultsData } from "@/lib/survey-queries";
import { closeSurveyRound } from "@/lib/survey-round-actions";
import { fetchRoundResults } from "@/lib/survey-round-actions";
import SurveyForm from "../components/survey/SurveyForm";
import ResultsBarChart from "../components/survey/ResultsBarChart";
import TextResponseList from "../components/survey/TextResponseList";
import CreateRoundDialog from "./CreateRoundDialog";
import { colors } from "../styles";

interface FeedbackClientProps {
  rounds: SurveyRoundData[];
  legacyResults: SurveyResultsData;
  legacyResponseCount: number;
  canManage: boolean;
  canViewResults: boolean;
  userId: string;
}

export default function FeedbackClient({
  rounds,
  legacyResults,
  legacyResponseCount,
  canManage,
  canViewResults,
  userId: _userId,
}: FeedbackClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<Record<string, SurveyResultsData>>({});
  const [loadingResults, setLoadingResults] = useState<string | null>(null);
  const [submittedRounds, setSubmittedRounds] = useState<Set<string>>(new Set());

  const activeRound = rounds.find((r) => r.status === "active") ?? null;
  const closedRounds = rounds.filter((r) => r.status === "closed");

  useEffect(() => {
    const submitted = new Set<string>();
    for (const round of rounds) {
      const key = `platform_survey_${round.id}`;
      if (localStorage.getItem(key)) submitted.add(round.id);
    }
    // Also check the legacy key
    if (localStorage.getItem("platform_survey_submitted")) {
      submitted.add("legacy");
    }
    setSubmittedRounds(submitted);
  }, [rounds]);

  const handleExpandRound = async (roundId: string) => {
    if (expandedRound === roundId) {
      setExpandedRound(null);
      return;
    }
    setExpandedRound(roundId);

    if (!roundResults[roundId]) {
      setLoadingResults(roundId);
      const results = await fetchRoundResults(roundId);
      setRoundResults((prev) => ({ ...prev, [roundId]: results }));
      setLoadingResults(null);
    }
  };

  const handleCloseRound = (roundId: string) => {
    startTransition(async () => {
      await closeSurveyRound(roundId);
      router.refresh();
    });
  };

  const _handleSurveyComplete = () => {
    if (activeRound) {
      localStorage.setItem(`platform_survey_${activeRound.id}`, "true");
      setSubmittedRounds((prev) => new Set(prev).add(activeRound.id));
    }
    setShowSurveyDialog(false);
    router.refresh();
  };

  const renderResults = (results: SurveyResultsData) => (
    <Box sx={{ mt: 1 }}>
      {results.conversationStyleCounts.length > 0 && (
        <ResultsBarChart title="Conversation Style" items={results.conversationStyleCounts} />
      )}
      {results.featureCounts.length > 0 && (
        <ResultsBarChart title="Feature Votes" items={results.featureCounts} />
      )}
      {results.mustHaveResponses.length > 0 && (
        <TextResponseList title="Must-Have Features" responses={results.mustHaveResponses} />
      )}
      {results.dealbreakerResponses.length > 0 && (
        <TextResponseList title="Dealbreakers" responses={results.dealbreakerResponses} />
      )}
      {results.otherFeedbackResponses.length > 0 && (
        <TextResponseList title="Other Feedback" responses={results.otherFeedbackResponses} />
      )}
    </Box>
  );

  const renderRoundCard = (round: SurveyRoundData, isActive: boolean) => {
    const isExpanded = expandedRound === round.id;
    const hasSubmitted = submittedRounds.has(round.id);
    const results = roundResults[round.id];
    const isLoading = loadingResults === round.id;

    return (
      <Paper
        key={round.id}
        sx={{
          mb: 2,
          border: isActive ? `2px solid ${colors.success}` : `1px solid ${colors.decorBorder}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Round {round.number}: {round.title}
              </Typography>
              <Chip
                label={isActive ? "Active" : "Closed"}
                size="small"
                color={isActive ? "success" : "default"}
              />
              {round.xpReward > 0 && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: 16 }} />}
                  label={`${round.xpReward} XP`}
                  size="small"
                  sx={{ bgcolor: colors.accentBgSubtle, color: colors.cyan400 }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isActive && !hasSubmitted && (
                <Button variant="contained" size="small" onClick={() => setShowSurveyDialog(true)}>
                  Take Survey
                </Button>
              )}
              {isActive && hasSubmitted && (
                <Chip label="Submitted" size="small" color="success" variant="outlined" />
              )}
              {isActive && canManage && (
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<LockIcon />}
                  onClick={() => handleCloseRound(round.id)}
                  disabled={isPending}
                >
                  Close Round
                </Button>
              )}
            </Box>
          </Box>

          {round.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {round.description}
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {round.responseCount} responses
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created {new Date(round.createdAt).toLocaleDateString()}
            </Typography>
            {round.closedAt && (
              <Typography variant="caption" color="text.secondary">
                Closed {new Date(round.closedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>

        {(canManage || canViewResults) && (
          <Accordion
            expanded={isExpanded}
            onChange={() => handleExpandRound(round.id)}
            disableGutters
            elevation={0}
            sx={{ "&::before": { display: "none" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {isExpanded ? "Hide Results" : "View Results"}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {results && renderResults(results)}
              {!isLoading && results && results.totalResponses === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No responses yet.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ py: 2 }}>
      {canManage && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
            disabled={!!activeRound}
          >
            Create New Round
          </Button>
        </Box>
      )}

      {activeRound && renderRoundCard(activeRound, true)}

      {closedRounds.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Past Rounds
          </Typography>
          {closedRounds.map((round) => renderRoundCard(round, false))}
        </Box>
      )}

      {rounds.length === 0 && legacyResponseCount === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          No survey rounds yet.
        </Typography>
      )}

      {legacyResponseCount > 0 && (canManage || canViewResults) && (
        <Box sx={{ mt: 3 }}>
          <Accordion
            expanded={expandedRound === "legacy"}
            onChange={() => {
              setExpandedRound(expandedRound === "legacy" ? null : "legacy");
            }}
            disableGutters
            sx={{ border: `1px solid ${colors.decorBorder}` }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Initial Survey
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {legacyResponseCount} responses
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>{renderResults(legacyResults)}</AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Survey Dialog */}
      <Dialog
        open={showSurveyDialog}
        onClose={() => setShowSurveyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          {activeRound?.title ?? "Survey"}
          <IconButton size="small" onClick={() => setShowSurveyDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <SurveyForm />
        </DialogContent>
      </Dialog>

      {/* Create Round Dialog */}
      <CreateRoundDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </Box>
  );
}
