"use client";

import { Avatar, Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { colors } from "../styles";
import { ThreadData } from "../types/thread";
import ThreadComposer from "./ThreadComposer";

const MAX_NESTING_DEPTH = 3;

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ThreadItemProps {
  thread: ThreadData;
  depth?: number;
  parentType: "POST" | "TOPIC";
  parentId: string;
  revalidateUrl: string;
}

export default function ThreadItem({
  thread,
  depth = 0,
  parentType,
  parentId,
  revalidateUrl,
}: ThreadItemProps) {
  const [showReply, setShowReply] = useState(false);
  const clampedDepth = Math.min(depth, MAX_NESTING_DEPTH);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          p: 2,
          ml: clampedDepth > 0 ? clampedDepth * 4 : 0,
          borderLeft: clampedDepth > 0 ? `2px solid ${colors.slate400}` : "none",
          borderBottom: `1px solid ${colors.slate600}`,
          backgroundColor: clampedDepth > 0 ? colors.hoverOverlay : "transparent",
          borderRadius: "2px",
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            fontSize: "0.85rem",
            fontWeight: 600,
            backgroundColor: colors.green900,
            color: colors.green400,
            flexShrink: 0,
          }}
        >
          {getInitials(thread.authorName)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.slate100 }}>
              {thread.authorName}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.slate400 }}>
              {formatTimestamp(thread.createdAt)}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: colors.slate300,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {thread.body}
          </Typography>

          <Button
            size="small"
            onClick={() => setShowReply(!showReply)}
            sx={{
              mt: 0.5,
              px: 1,
              minWidth: "auto",
              textTransform: "none",
              fontSize: "0.75rem",
              color: colors.slate400,
              "&:hover": {
                color: colors.green400,
                backgroundColor: "transparent",
              },
            }}
          >
            Reply
          </Button>

          {showReply && (
            <Box sx={{ mt: 1 }}>
              <ThreadComposer
                parentType={parentType}
                parentId={parentId}
                revalidateUrl={revalidateUrl}
                replyToId={thread.id}
                onCancel={() => setShowReply(false)}
                placeholder="Write a reply..."
              />
            </Box>
          )}
        </Box>
      </Box>

      {thread.replies.length > 0 &&
        thread.replies.map((reply) => (
          <ThreadItem
            key={reply.id}
            thread={reply}
            depth={depth + 1}
            parentType={parentType}
            parentId={parentId}
            revalidateUrl={revalidateUrl}
          />
        ))}
    </Box>
  );
}
