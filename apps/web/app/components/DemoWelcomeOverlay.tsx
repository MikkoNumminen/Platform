"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Box, Button, Typography } from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { useTranslations } from "next-intl";
import { colors } from "../styles";

const STORAGE_KEY = "demo-welcome-dismissed";

export default function DemoWelcomeOverlay() {
  const { data: session } = useSession();
  const t = useTranslations("demo");
  const [visible, setVisible] = useState(false);

  const isDemoUser = Boolean(
    (session?.user as { demoSessionId?: string } | undefined)?.demoSessionId,
  );

  useEffect(() => {
    if (isDemoUser && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, [isDemoUser]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <Box
      onClick={dismiss}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.backdrop,
        cursor: "pointer",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          maxWidth: 460,
          mx: 2,
          p: 4,
          borderRadius: 3,
          backgroundColor: colors.slate700,
          border: `1px solid ${colors.accentBorder}`,
          boxShadow: `0 0 40px ${colors.accentGlow}`,
          textAlign: "center",
        }}
      >
        <RocketLaunchIcon sx={{ fontSize: 48, color: colors.green400, mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.slate100, mb: 1 }}>
          {t("welcomeTitle")}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.slate400, mb: 3, lineHeight: 1.7 }}>
          {t("welcomeBody")}
        </Typography>
        <Button
          variant="contained"
          onClick={dismiss}
          sx={{
            fontWeight: 600,
            px: 4,
            py: 1,
            background: `linear-gradient(135deg, ${colors.btnPrimaryFrom}, ${colors.btnPrimaryTo})`,
            "&:hover": {
              background: `linear-gradient(135deg, ${colors.btnPrimaryHoverFrom}, ${colors.btnPrimaryHoverTo})`,
            },
          }}
        >
          {t("welcomeStart")}
        </Button>
      </Box>
    </Box>
  );
}
