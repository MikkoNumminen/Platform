"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography } from "@mui/material";
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

        <Box sx={{ mt: 2 }}>
          <FeedbackList items={items} canReply={canReply} onReplied={loadFeedback} />
        </Box>
      </Box>
    </Paper>
  );
}
