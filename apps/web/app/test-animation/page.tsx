"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import dynamic from "next/dynamic";
const PromotionCelebration = dynamic(() => import("../components/PromotionCelebration"), {
  ssr: false,
});

function DevOnly({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") return null;
  return <>{children}</>;
}

export default function TestAnimationPage() {
  const [playing, setPlaying] = useState(false);

  return (
    <DevOnly>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 3,
        }}
      >
        <Typography variant="h4">Promotion Animation Test</Typography>
        <Typography variant="body2" color="text.secondary">
          Dev only — this page is excluded from production.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => setPlaying(true)}
          disabled={playing}
        >
          {playing ? "Playing..." : "Trigger Celebration"}
        </Button>

        {playing && <PromotionCelebration onComplete={() => setPlaying(false)} />}
      </Box>
    </DevOnly>
  );
}
