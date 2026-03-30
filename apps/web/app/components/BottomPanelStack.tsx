"use client";

import { Box } from "@mui/material";
import TutorialChecklist from "./TutorialChecklist";
import CampaignQuestPanel from "./CampaignQuestPanel";

export default function BottomPanelStack() {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: { xs: 8, sm: 16 },
        right: { xs: 8, sm: 16 },
        zIndex: 1099,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        alignItems: "flex-end",
        maxHeight: "90vh",
        overflow: "auto",
        // Hide scrollbar but keep scrollable
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      <CampaignQuestPanel />
      <TutorialChecklist />
    </Box>
  );
}
