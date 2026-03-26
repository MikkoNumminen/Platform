"use client";

import { Box, Typography } from "@mui/material";
import { colors } from "../styles";
import { ThreadData } from "../types/thread";
import ThreadItem from "./ThreadItem";
import ThreadComposer from "./ThreadComposer";

interface ThreadListProps {
  threads: ThreadData[];
  parentType: "POST" | "TOPIC";
  parentId: string;
  revalidateUrl: string;
}

export default function ThreadList({
  threads,
  parentType,
  parentId,
  revalidateUrl,
}: ThreadListProps) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          color: colors.slate100,
          fontSize: "1.1rem",
          fontWeight: 600,
          mb: 2,
        }}
      >
        Discussion ({threads.length})
      </Typography>

      <ThreadComposer
        parentType={parentType}
        parentId={parentId}
        revalidateUrl={revalidateUrl}
      />

      <Box
        sx={{
          mt: 2,
          border: `1px solid ${colors.slate600}`,
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {threads.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              p: 3,
              textAlign: "center",
              color: colors.slate400,
            }}
          >
            No comments yet. Start the conversation.
          </Typography>
        ) : (
          threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              parentType={parentType}
              parentId={parentId}
              revalidateUrl={revalidateUrl}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
