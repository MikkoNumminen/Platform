"use client";

import { useSession, signOut } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import { useTranslations } from "next-intl";
import { LOCALSTORAGE_KEY } from "@/lib/survey-config";

export default function DemoBanner() {
  const { data: session } = useSession();
  const t = useTranslations("demo");

  if (!session?.user?.demoSessionId) return null;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
        py: 0.75,
        backgroundColor: "#fbbf24",
        color: "#1a1a1a",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {t("bannerMessage")}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={<LogoutIcon />}
        onClick={() => {
          localStorage.removeItem(LOCALSTORAGE_KEY);
          localStorage.removeItem("tutorial-progress");
          signOut();
        }}
        sx={{
          color: "#1a1a1a",
          borderColor: "#1a1a1a",
          fontWeight: 600,
          fontSize: "0.75rem",
          py: 0.25,
          "&:hover": {
            borderColor: "#000",
            backgroundColor: "rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        {t("exitDemo")}
      </Button>
    </Box>
  );
}
