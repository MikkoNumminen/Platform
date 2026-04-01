"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FeedbackIcon from "@mui/icons-material/Feedback";
import FeedbackForm from "./FeedbackForm";
import FeedbackList from "./FeedbackList";
import { getAllFeedback } from "@/lib/feedback-actions";
import type { FeedbackItem } from "@/lib/feedback-actions";
import { colors } from "../../styles";

interface FeedbackSectionProps {
  canReply: boolean;
}

export default function FeedbackSection({ canReply }: FeedbackSectionProps) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  const loadFeedback = useCallback(async () => {
    const data = await getAllFeedback();
    setItems(data);
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return (
    <Paper sx={{ mb: 2, border: `1px solid ${colors.decorBorder}`, overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FeedbackIcon sx={{ color: colors.cyan400 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Quick Feedback
          </Typography>
          {items.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              ({items.length})
            </Typography>
          )}
        </Box>

        <FeedbackForm onSubmitted={loadFeedback} />
      </Box>

      {items.length > 0 && (
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          disableGutters
          elevation={0}
          sx={{ "&::before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {expanded ? "Hide Feedback" : "View Feedback"}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FeedbackList items={items} canReply={canReply} onReplied={loadFeedback} />
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
}
