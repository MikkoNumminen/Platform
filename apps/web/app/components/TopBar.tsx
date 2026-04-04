"use client";

import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { colors } from "../styles";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";

const ELEVATED_ROLES = ["superuser", "vuohi"];

interface TopBarProps {
  title: string;
  backHref?: string;
}

export default function TopBar({ title, backHref }: TopBarProps) {
  const { data: session } = useSession();
  const role = String(session?.user?.role || "");
  const isDemoUser = Boolean(session?.user?.demoSessionId);
  const displayTitle =
    title === "Platform" && ELEVATED_ROLES.includes(role) && !isDemoUser ? "Vuohiliitto" : title;

  return (
    <AppBar
      position="static"
      sx={{
        mb: 1.5,
        backgroundColor: colors.slate600,
        borderRadius: 0,
        borderBottom: `1px solid ${colors.slate300}`,
      }}
      elevation={0}
    >
      <Toolbar sx={{ maxWidth: 1280, width: "100%", mx: "auto", px: { xs: 1, sm: 2 } }}>
        {backHref && (
          <IconButton
            data-tutorial="back-button"
            component={Link}
            href={backHref}
            aria-label="Go back"
            sx={{ color: colors.slate100, mr: 1 }}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: colors.slate100,
            fontSize: { xs: "1.1rem", sm: "1.5rem" },
          }}
        >
          {displayTitle}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LanguageSwitcher />
          <ThemeSwitcher />
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
