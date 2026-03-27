"use client";

import { useSession } from "next-auth/react";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { colors } from "../styles";

export default function PendingBanner() {
  const { data: session } = useSession();
  const t = useTranslations("pending");

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
        {t("banner")}
      </Typography>
    </Box>
  );
}
