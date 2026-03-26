"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import { useState, useTransition } from "react";
import { colors } from "../styles";
import { createThread } from "@/lib/thread-actions";

interface ThreadComposerProps {
  parentType: "POST" | "TOPIC";
  parentId: string;
  revalidateUrl: string;
  replyToId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

export default function ThreadComposer({
  parentType,
  parentId,
  revalidateUrl,
  replyToId,
  onCancel,
  placeholder = "Write a comment...",
}: ThreadComposerProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createThread(parentType, parentId, body, replyToId, revalidateUrl);
      if (result?.error) {
        setError(result.error);
      } else {
        setBody("");
        onCancel?.();
      }
    });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2,
        borderRadius: "4px",
        border: `1px solid ${colors.slate600}`,
        backgroundColor: colors.slate700,
      }}
    >
      <TextField
        multiline
        minRows={replyToId ? 2 : 3}
        maxRows={8}
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        variant="outlined"
        fullWidth
        disabled={isPending}
        sx={{
          "& .MuiOutlinedInput-root": {
            color: colors.slate100,
            fontSize: "0.9rem",
            "& fieldset": {
              borderColor: colors.slate400,
            },
            "&:hover fieldset": {
              borderColor: colors.slate300,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.green400,
            },
          },
          "& .MuiInputBase-input::placeholder": {
            color: colors.slate400,
            opacity: 1,
          },
        }}
      />
      {error && (
        <Typography variant="caption" sx={{ color: colors.error }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {onCancel && (
          <Button
            onClick={onCancel}
            disabled={isPending}
            sx={{
              textTransform: "none",
              fontSize: "0.85rem",
              color: colors.slate400,
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          disabled={body.trim().length === 0 || isPending}
          onClick={handleSubmit}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            backgroundColor: colors.green900,
            color: colors.green400,
            border: `1px solid ${colors.green400}`,
            "&:hover": {
              backgroundColor: colors.green400,
              color: colors.green900,
            },
            "&.Mui-disabled": {
              backgroundColor: colors.slate600,
              color: colors.slate400,
              borderColor: colors.slate400,
            },
          }}
        >
          {isPending ? "Posting..." : "Post comment"}
        </Button>
      </Box>
    </Box>
  );
}
