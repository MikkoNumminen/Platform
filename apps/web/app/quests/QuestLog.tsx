"use client";

import { useState } from "react";
import { Box, Card, CardContent, Chip, LinearProgress, Tab, Tabs, Typography } from "@mui/material";
import TopBar from "../components/TopBar";
import { colors } from "../styles";
import type { LevelThreshold } from "@/lib/gamification/xp-config";

interface QuestData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  xpReward: number;
  repeatable: boolean;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: Date | null | undefined;
}

interface XpProgress {
  current: LevelThreshold;
  next: LevelThreshold | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

interface QuestLogProps {
  quests: QuestData[];
  xpProgress: XpProgress;
}

const QUEST_TABS = ["onboarding", "daily", "weekly", "special"] as const;
const TAB_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  daily: "Daily",
  weekly: "Weekly",
  special: "Special",
};

export default function QuestLog({ quests, xpProgress }: QuestLogProps) {
  const [tab, setTab] = useState(0);
  const currentType = QUEST_TABS[tab];
  const filtered = quests.filter((q) => q.type === currentType);

  return (
    <>
      <TopBar title="Quest Log" backHref="/" />
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        {/* XP Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Level {xpProgress.current.level} — {xpProgress.current.title}
              </Typography>
              {xpProgress.next && (
                <Typography variant="body2" sx={{ color: colors.slate400 }}>
                  {xpProgress.xpIntoLevel} / {xpProgress.xpForNextLevel} XP
                </Typography>
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={xpProgress.progressPercent}
              sx={{
                height: 12,
                borderRadius: 2,
                backgroundColor: colors.surfaceOverlay,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  background: colors.progressGradient,
                },
              }}
            />
            {xpProgress.next && (
              <Typography
                variant="caption"
                sx={{ color: colors.slate400, mt: 0.5, display: "block" }}
              >
                Next: Level {xpProgress.next.level} — {xpProgress.next.title}
              </Typography>
            )}
            {!xpProgress.next && (
              <Typography
                variant="caption"
                sx={{ color: colors.green400, mt: 0.5, display: "block" }}
              >
                Max level reached!
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2,
            "& .MuiTab-root": { color: colors.slate400 },
            "& .Mui-selected": { color: colors.green400 },
            "& .MuiTabs-indicator": { backgroundColor: colors.green400 },
          }}
        >
          {QUEST_TABS.map((t) => (
            <Tab key={t} label={TAB_LABELS[t]} />
          ))}
        </Tabs>

        {/* Quest List */}
        <Box data-tutorial="quest-list" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filtered.length === 0 && (
            <Typography variant="body2" sx={{ color: colors.slate400, py: 4, textAlign: "center" }}>
              No {currentType} quests available.
            </Typography>
          )}
          {filtered.map((quest) => (
            <Card
              key={quest.id}
              sx={{
                opacity: quest.completed ? 0.6 : 1,
                border: quest.completed ? `1px solid ${colors.accentBorder}` : undefined,
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{quest.icon}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {quest.name}
                      </Typography>
                      <Chip
                        label={`+${quest.xpReward} XP`}
                        size="small"
                        sx={{
                          backgroundColor: colors.accentBgSubtle,
                          color: colors.green400,
                          fontWeight: 600,
                          height: 22,
                          fontSize: "0.7rem",
                        }}
                      />
                      {quest.completed && (
                        <Chip
                          label="Complete"
                          size="small"
                          sx={{
                            backgroundColor: colors.accentBgSubtle,
                            color: colors.green400,
                            height: 22,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                      {quest.repeatable && (
                        <Chip
                          label="Repeatable"
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: colors.slate400,
                            color: colors.slate400,
                            height: 22,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.slate400, mt: 0.5 }}>
                      {quest.description}
                    </Typography>
                    {quest.target > 1 && (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: colors.slate400 }}>
                            Progress
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.slate300 }}>
                            {quest.progress} / {quest.target}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (quest.progress / quest.target) * 100)}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: colors.surfaceOverlay,
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 1,
                              backgroundColor: quest.completed ? colors.green400 : colors.cyan400,
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </>
  );
}
