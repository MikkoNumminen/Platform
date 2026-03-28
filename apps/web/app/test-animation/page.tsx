"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import PromotionCelebration from "../components/PromotionCelebration";

export default function TestAnimationPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [playing, setPlaying] = useState(false);

  return (
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
      <Button variant="contained" size="large" onClick={() => setPlaying(true)} disabled={playing}>
        {playing ? "Playing..." : "Trigger Celebration"}
      </Button>

      {playing && <PromotionCelebration onComplete={() => setPlaying(false)} />}
    </Box>
  );
}
