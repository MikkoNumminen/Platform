"use client";

import { useState } from "react";
import { Box, Card, CardContent, Chip, LinearProgress, Tab, Tabs, Typography } from "@mui/material";
import TopBar from "../components/TopBar";
import XpProgressCard from "../components/XpProgressCard";
import type { XpProgress } from "../components/XpProgressCard";
import QuestReceivedCelebration from "../components/QuestReceivedCelebration";
import QuestListClient from "../admin/quests/QuestListClient";
import { colors, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from "../styles";

interface QuestData {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  xpReward: number;
  repeatable: boolean;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: Date | null | undefined;
}

interface CustomQuestData {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: string;
  priority: string;
  targetSkill: string | null;
  deadline: string | null;
  completedAt: string | null;
  creator: string;
}

interface QuestBoardData {
  quests: Array<{
    id: string;
    title: string;
    description: string;
    xpReward: number;
    status: string;
    priority: string;
    targetSkill: string | null;
    deadline: string | null;
    completedAt: string | null;
    createdAt: string;
    assignee: { id: string; alias: string | null; name: string | null; image: string | null };
    creator: { id: string; alias: string | null; name: string | null };
  }>;
  users: Array<{ id: string; alias: string | null; name: string | null }>;
  canManage: boolean;
}

interface QuestLogProps {
  quests: QuestData[];
  xpProgress: XpProgress;
  customQuests?: CustomQuestData[];
  questBoard?: QuestBoardData;
}

const QUEST_TABS = ["onboarding", "daily", "weekly", "special"] as const;
const TAB_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  daily: "Daily",
  weekly: "Weekly",
  special: "Special",
};

export default function QuestLog({
  quests,
  xpProgress,
  customQuests = [],
  questBoard,
}: QuestLogProps) {
  const [tab, setTab] = useState(0);
  const currentType = QUEST_TABS[tab];
  const filtered = quests.filter((q) => q.type === currentType);

  const activeCustomQuests = customQuests.filter((q) => q.status !== "completed");

  return (
    <>
      <QuestReceivedCelebration
        quests={activeCustomQuests.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          xpReward: q.xpReward,
          priority: q.priority,
          creator: q.creator,
        }))}
      />
      <TopBar title="Quest Log" backHref="/" />
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        <XpProgressCard xpProgress={xpProgress} showNextLevel />

        {/* Quest Board (embedded for superuser/vuohi/admin) */}
        {questBoard && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: colors.green400, fontWeight: 600, mb: 1, display: "block" }}
            >
              Quest Board
            </Typography>
            <QuestListClient
              initialQuests={questBoard.quests}
              users={questBoard.users}
              canManage={questBoard.canManage}
            />
          </Box>
        )}

        {/* Assigned Quests for regular users (no quest board access) */}
        {!questBoard && customQuests.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: colors.green400, fontWeight: 600, mb: 1, display: "block" }}
            >
              Assigned Quests
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {customQuests.map((cq) => {
                const isCompleted = cq.status === "completed";
                const isOverdue = cq.deadline && !isCompleted && new Date(cq.deadline) < new Date();
                return (
                  <Card
                    key={cq.id}
                    sx={{
                      opacity: isCompleted ? 0.6 : 1,
                      borderLeft: `3px solid ${STATUS_COLORS[cq.status] ?? colors.slate400}`,
                    }}
                  >
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            textDecoration: isCompleted ? "line-through" : "none",
                          }}
                        >
                          {cq.title}
                        </Typography>
                        <Chip
                          label={STATUS_LABELS[cq.status] ?? cq.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            backgroundColor: "transparent",
                            color: STATUS_COLORS[cq.status],
                            border: `1px solid ${STATUS_COLORS[cq.status]}`,
                          }}
                        />
                        <Chip
                          label={cq.priority}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            backgroundColor: "transparent",
                            color: PRIORITY_COLORS[cq.priority] ?? colors.slate400,
                            border: `1px solid ${PRIORITY_COLORS[cq.priority] ?? colors.slate400}`,
                          }}
                        />
                        {cq.xpReward > 0 && (
                          <Chip
                            label={`+${cq.xpReward} XP`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              backgroundColor: colors.accentBgSubtle,
                              color: colors.green400,
                            }}
                          />
                        )}
                        {cq.targetSkill && (
                          <Chip
                            label={`${cq.targetSkill} · 2x XP`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.6rem",
                              backgroundColor: "rgba(34,211,238,0.12)",
                              color: colors.info,
                              border: `1px solid ${colors.info}`,
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: colors.slate400 }}>
                        {cq.description}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: colors.slate400 }}>
                          From {cq.creator}
                        </Typography>
                        {cq.deadline && (
                          <Typography
                            variant="caption"
                            sx={{ color: isOverdue ? colors.error : colors.slate400 }}
                          >
                            {isOverdue ? "Overdue: " : "Due: "}
                            {new Date(cq.deadline).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

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
