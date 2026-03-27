"use client";

import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { colors } from "../styles";
import ThemeSwitcher from "./ThemeSwitcher";
import UserMenu from "./UserMenu";

interface TopBarProps {
  title: string;
  backHref?: string;
}

export default function TopBar({ title, backHref }: TopBarProps) {
  return (
    <AppBar
      position="static"
      sx={{
        mb: 1.5,
        backgroundColor: colors.slate600,
        borderRadius: "4px",
        border: `1px solid ${colors.slate300}`,
      }}
      elevation={0}
    >
      <Toolbar>
        {backHref && (
          <IconButton
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
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ThemeSwitcher />
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
