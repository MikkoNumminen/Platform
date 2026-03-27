"use client";

import { Box } from "@mui/material";
import { useTheme } from "../ThemeRegistry";

export default function DecorativeDivider() {
  const { currentTheme } = useTheme();

  if (currentTheme !== "epic") {
    return <Box sx={{ my: 2, borderTop: "1px solid var(--platform-slate300)" }} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        my: 2,
        gap: 1,
      }}
    >
      <Box
        sx={{
          flex: 1,
          height: "1px",
          background: "linear-gradient(90deg, transparent, #8B7355)",
        }}
      />
      <svg width="20" height="20" viewBox="0 0 20 20" data-testid="decorative-diamond">
        <path d="M 3 10 L 10 3 L 17 10 L 10 17 Z" fill="none" stroke="#D4A843" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2" fill="#D4A843" />
      </svg>
      <Box
        sx={{
          flex: 1,
          height: "1px",
          background: "linear-gradient(90deg, #8B7355, transparent)",
        }}
      />
    </Box>
  );
}
