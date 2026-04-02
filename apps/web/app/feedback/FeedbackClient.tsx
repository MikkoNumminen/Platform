"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { SurveyRoundData } from "@/lib/survey-round-queries";
import type { SurveyResultsData } from "@/lib/survey-queries";
import { closeSurveyRound, fetchRoundResults } from "@/lib/survey-round-actions";
import SurveyForm from "../components/survey/SurveyForm";
import CustomSurveyForm from "../components/survey/CustomSurveyForm";
import type { CustomQuestion } from "@/lib/custom-survey-config";
import SurveyRoundCard from "./SurveyRoundCard";
import SurveyResults from "./SurveyResults";
import CreateRoundDialog from "./CreateRoundDialog";
import FeedbackSection from "../components/feedback/FeedbackSection";
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
  const [surveyRoundId, setSurveyRoundId] = useState<string | null>(null);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<Record<string, SurveyResultsData>>({});
  const [loadingResults, setLoadingResults] = useState<string | null>(null);
  const [submittedRounds, setSubmittedRounds] = useState<Set<string>>(new Set());

  const activeRounds = rounds.filter((r) => r.status === "active");
  const closedRounds = rounds.filter((r) => r.status === "closed");

  useEffect(() => {
    const submitted = new Set<string>();
    for (const round of rounds) {
      const key = `platform_survey_${round.id}`;
      if (localStorage.getItem(key)) submitted.add(round.id);
    }
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

  const handleSurveyComplete = (roundId: string) => {
    localStorage.setItem(`platform_survey_${roundId}`, "true");
    setSubmittedRounds((prev) => new Set(prev).add(roundId));
    setSurveyRoundId(null);
    router.refresh();
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
          >
            Create New Round
          </Button>
        </Box>
      )}

      <FeedbackSection canReply={canManage} />

      {activeRounds.map((round) => (
        <SurveyRoundCard
          key={round.id}
          round={round}
          isActive
          isExpanded={expandedRound === round.id}
          hasSubmitted={submittedRounds.has(round.id)}
          results={roundResults[round.id]}
          isLoading={loadingResults === round.id}
          canManage={canManage}
          canViewResults={canViewResults}
          isPending={isPending}
          onExpand={handleExpandRound}
          onTakeSurvey={setSurveyRoundId}
          onCloseRound={handleCloseRound}
        />
      ))}

      {closedRounds.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Past Rounds
          </Typography>
          {closedRounds.map((round) => (
            <SurveyRoundCard
              key={round.id}
              round={round}
              isActive={false}
              isExpanded={expandedRound === round.id}
              hasSubmitted={submittedRounds.has(round.id)}
              results={roundResults[round.id]}
              isLoading={loadingResults === round.id}
              canManage={canManage}
              canViewResults={canViewResults}
              isPending={isPending}
              onExpand={handleExpandRound}
              onTakeSurvey={setSurveyRoundId}
              onCloseRound={handleCloseRound}
            />
          ))}
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
            onChange={() => setExpandedRound(expandedRound === "legacy" ? null : "legacy")}
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
            <AccordionDetails>
              <SurveyResults results={legacyResults} />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {(() => {
        const selectedRound = rounds.find((r) => r.id === surveyRoundId);
        return (
          <Dialog
            open={!!surveyRoundId}
            onClose={() => setSurveyRoundId(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              {selectedRound?.title ?? "Survey"}
              <IconButton size="small" onClick={() => setSurveyRoundId(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {selectedRound?.customQuestions ? (
                <CustomSurveyForm
                  questions={selectedRound.customQuestions as CustomQuestion[]}
                  roundId={selectedRound.id}
                  roundTitle={selectedRound.title}
                  onComplete={() => handleSurveyComplete(selectedRound.id)}
                />
              ) : (
                <SurveyForm />
              )}
            </DialogContent>
          </Dialog>
        );
      })()}

      <CreateRoundDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </Box>
  );
}
