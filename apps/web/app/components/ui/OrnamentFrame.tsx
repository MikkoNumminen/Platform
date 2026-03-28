"use client";

import { Box } from "@mui/material";
import { useTheme } from "../ThemeRegistry";
import { colors } from "../../styles";

interface OrnamentFrameProps {
  children: React.ReactNode;
}

function CornerOrnament({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      data-testid="corner-ornament"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M 2 8 L 8 2 L 14 8 L 8 14 Z"
        fill={colors.decorAccent}
        stroke={colors.decorBorder}
        strokeWidth="1"
      />
    </svg>
  );
}

export default function OrnamentFrame({ children }: OrnamentFrameProps) {
  const { currentTheme } = useTheme();

  if (currentTheme !== "epic") {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          top: -8,
          left: -8,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <CornerOrnament />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: -8,
          right: -8,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <CornerOrnament rotate={0} />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: -8,
          left: -8,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <CornerOrnament />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: -8,
          right: -8,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <CornerOrnament />
      </Box>
      {children}
    </Box>
  );
}
