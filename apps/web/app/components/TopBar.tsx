"use client";

import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import { colors } from "../styles";
import ThemeSwitcher from "./ThemeSwitcher";
import UserMenu from "./UserMenu";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
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
