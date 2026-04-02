"use client";

import { useState, useTransition } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import type { FeedbackItem } from "@/lib/feedback-actions";
import { replyToFeedback } from "@/lib/feedback-actions";
import { colors } from "../../styles";

interface FeedbackListProps {
  items: FeedbackItem[];
  canReply: boolean;
  onReplied: () => void;
}

export default function FeedbackList({ items, canReply, onReplied }: FeedbackListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReply = (feedbackId: string) => {
    startTransition(async () => {
      const result = await replyToFeedback(feedbackId, replyText);
      if (!result) {
        setReplyingTo(null);
        setReplyText("");
        onReplied();
      }
    });
  };

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        No feedback yet. Be the first to share your thoughts!
      </Typography>
    );
  }

  return (
    <Box sx={{ maxHeight: 500, overflow: "auto" }}>
      {items.map((item) => (
        <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography variant="body2">{item.message}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {item.author.alias ?? item.author.name ?? "User"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              &middot; {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          {item.adminReply && (
            <Paper
              sx={{
                mt: 1.5,
                p: 1.5,
                bgcolor: colors.accentBgSubtle,
                border: `1px solid ${colors.accentBorder}`,
              }}
            >
              <Typography variant="body2">{item.adminReply}</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {item.adminReplyBy?.alias ?? item.adminReplyBy?.name ?? "Admin"} &middot;{" "}
                {item.adminRepliedAt && new Date(item.adminRepliedAt).toLocaleDateString()}
              </Typography>
            </Paper>
          )}

          {canReply && !item.adminReply && (
            <>
              {replyingTo === item.id ? (
                <Box sx={{ mt: 1.5 }}>
                  <TextField
                    multiline
                    minRows={1}
                    maxRows={4}
                    fullWidth
                    size="small"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
                    disabled={isPending}
                  />
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleReply(item.id)}
                      disabled={isPending || !replyText.trim()}
                    >
                      Reply
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  size="small"
                  startIcon={<ReplyIcon />}
                  onClick={() => {
                    setReplyingTo(item.id);
                    setReplyText("");
                  }}
                  sx={{ mt: 1 }}
                >
                  Reply
                </Button>
              )}
            </>
          )}
        </Paper>
      ))}
    </Box>
  );
}
