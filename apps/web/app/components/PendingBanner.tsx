"use client";

import { useSession } from "next-auth/react";
import { Box, Typography } from "@mui/material";
import { colors } from "../styles";

export default function PendingBanner() {
  const { data: session } = useSession();

  if (!session?.user || session.user.role !== "pending") {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: colors.warning,
        color: colors.slate700,
        px: 2,
        py: 1.5,
        borderRadius: "4px",
        mb: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Your account is pending approval. An admin needs to approve your account before you can
        access community content.
      </Typography>
    </Box>
  );
}
