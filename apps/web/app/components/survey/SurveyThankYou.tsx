"use client";

import { Box, Button, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { colors } from "../../styles";

export default function SurveyThankYou() {
  const { data: session } = useSession();
  const t = useTranslations("survey.thankYou");
  const isPending = session?.user?.role === "pending";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: 6,
      }}
    >
      <CheckCircleOutlineIcon
        sx={{
          fontSize: 80,
          color: colors.green400,
          mb: 2,
          animation: "fadeInScale 0.5s ease-out",
          "@keyframes fadeInScale": {
            "0%": { opacity: 0, transform: "scale(0.5)" },
            "100%": { opacity: 1, transform: "scale(1)" },
          },
        }}
      />
      <Typography variant="h4" gutterBottom>
        {t("title")}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t("message")}
      </Typography>
      {isPending ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            p: 3,
            borderRadius: 2,
            border: `1px solid ${colors.slate300}`,
          }}
        >
          <HourglassEmptyIcon sx={{ fontSize: 32, color: colors.green400 }} />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {t("pendingTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("pendingMessage")}
          </Typography>
        </Box>
      ) : (
        <Button variant="outlined" href="/">
          {t("backHome")}
        </Button>
      )}
    </Box>
  );
}
