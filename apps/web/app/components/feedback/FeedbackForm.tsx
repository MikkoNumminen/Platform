"use client";

import { useState, useTransition } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { submitFeedback } from "@/lib/feedback-actions";

const MAX_LENGTH = 1000;

interface FeedbackFormProps {
  onSubmitted: () => void;
}

export default function FeedbackForm({ onSubmitted }: FeedbackFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback(message);
      if (result.success) {
        setMessage("");
        onSubmitted();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Box>
      <TextField
        multiline
        minRows={2}
        maxRows={6}
        fullWidth
        placeholder="Share your thoughts, suggestions, or ideas..."
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
        disabled={isPending}
        size="small"
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {message.length}/{MAX_LENGTH}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={isPending || !message.trim()}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
