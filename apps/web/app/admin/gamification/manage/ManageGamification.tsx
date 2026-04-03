"use client";

import { useState } from "react";
import { Alert, Box, Tab, Tabs } from "@mui/material";
import TopBar from "../../../components/TopBar";
import AchievementEditor from "./AchievementEditor";
import type { AchievementData } from "./AchievementEditor";
import QuestEditor from "./QuestEditor";
import type { QuestData } from "./QuestEditor";

export default function ManageGamification({
  achievements,
  quests,
}: {
  achievements: AchievementData[];
  quests: QuestData[];
}) {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <TopBar title="Manage Achievements & Quests" backHref="/admin/gamification" />
      <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Achievements (${achievements.length})`} />
          <Tab label={`Quests (${quests.length})`} />
        </Tabs>

        {tab === 0 && <AchievementEditor achievements={achievements} setError={setError} />}
        {tab === 1 && <QuestEditor quests={quests} setError={setError} />}
      </Box>
    </>
  );
}
