import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import StarIcon from "@mui/icons-material/Star";
import type { SurveyRoundData } from "@/lib/survey-round-queries";
import type { SurveyResultsData } from "@/lib/survey-queries";
import SurveyResults from "./SurveyResults";
import { colors } from "../styles";

interface SurveyRoundCardProps {
  round: SurveyRoundData;
  isActive: boolean;
  isExpanded: boolean;
  hasSubmitted: boolean;
  results: SurveyResultsData | undefined;
  isLoading: boolean;
  canManage: boolean;
  canViewResults: boolean;
  isPending: boolean;
  onExpand: (roundId: string) => void;
  onTakeSurvey: (roundId: string) => void;
  onCloseRound: (roundId: string) => void;
}

export default function SurveyRoundCard({
  round,
  isActive,
  isExpanded,
  hasSubmitted,
  results,
  isLoading,
  canManage,
  canViewResults,
  isPending,
  onExpand,
  onTakeSurvey,
  onCloseRound,
}: SurveyRoundCardProps) {
  return (
    <Paper
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
              <Button variant="contained" size="small" onClick={() => onTakeSurvey(round.id)}>
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
                onClick={() => onCloseRound(round.id)}
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
          {round.deadline && (
            <Typography variant="caption" color="text.secondary">
              Deadline {new Date(round.deadline).toLocaleDateString()}
            </Typography>
          )}
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
          onChange={() => onExpand(round.id)}
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
            {results && <SurveyResults results={results} />}
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
}
