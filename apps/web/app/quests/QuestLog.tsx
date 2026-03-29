"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";
import TopBar from "../components/TopBar";
import QuestReceivedCelebration from "../components/QuestReceivedCelebration";
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
  canManageQuests?: boolean;
  questBoard?: QuestBoardData;
}

const QUEST_TABS = ["onboarding", "daily", "weekly", "assigned"] as const;
const TAB_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  daily: "Daily",
  weekly: "Weekly",
  assigned: "Assigned",
};

const STATUS_COLORS: Record<string, string> = {
  open: colors.warning,
  in_progress: colors.info,
  completed: colors.success,
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: colors.slate400,
  normal: colors.info,
  high: colors.warning,
  urgent: colors.error,
};

function tabCount(quests: QuestData[], type: string): { done: number; total: number } {
  const filtered = quests.filter((q) => q.type === type);
  return { done: filtered.filter((q) => q.completed).length, total: filtered.length };
}

export default function QuestLog({
  quests,
  xpProgress,
  customQuests = [],
  canManageQuests,
}: QuestLogProps) {
  const [tab, setTab] = useState(0);
  const currentType = QUEST_TABS[tab];

  const activeCustomQuests = customQuests.filter((q) => q.status !== "completed");

  // For system quest tabs: separate active and completed
  const systemFiltered = quests.filter((q) => q.type === currentType);
  const activeSystemQuests = systemFiltered.filter((q) => !q.completed);
  const completedSystemQuests = systemFiltered.filter((q) => q.completed);

  // Tab label with progress count
  function tabLabel(type: string): string {
    if (type === "assigned") {
      const done = customQuests.filter((q) => q.status === "completed").length;
      return customQuests.length > 0
        ? `${TAB_LABELS[type]} (${done}/${customQuests.length})`
        : TAB_LABELS[type];
    }
    const { done, total } = tabCount(quests, type);
    return total > 0 ? `${TAB_LABELS[type]} (${done}/${total})` : TAB_LABELS[type];
  }

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
            {xpProgress.next ? (
              <Typography
                variant="caption"
                sx={{ color: colors.slate400, mt: 0.5, display: "block" }}
              >
                Next: Level {xpProgress.next.level} — {xpProgress.next.title}
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{ color: colors.green400, mt: 0.5, display: "block" }}
              >
                Max level reached!
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Quest Board link for managers */}
        {canManageQuests && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button
              component={Link}
              href="/admin/quests"
              size="small"
              sx={{ color: colors.green400, fontSize: "0.7rem" }}
            >
              Quest Board
            </Button>
          </Box>
        )}

        {/* Tabs with progress counts */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2,
            "& .MuiTab-root": { color: colors.slate400, fontSize: "0.8rem", minWidth: 0 },
            "& .Mui-selected": { color: colors.green400 },
            "& .MuiTabs-indicator": { backgroundColor: colors.green400 },
          }}
        >
          {QUEST_TABS.map((t) => (
            <Tab key={t} label={tabLabel(t)} />
          ))}
        </Tabs>

        {/* Quest List */}
        <Box data-tutorial="quest-list" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {currentType === "assigned" ? (
            // Assigned tab: show custom quests
            customQuests.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: colors.slate400, py: 4, textAlign: "center" }}
              >
                No assigned quests.
              </Typography>
            ) : (
              <>
                {/* Active assigned quests */}
                {customQuests
                  .filter((q) => q.status !== "completed")
                  .map((cq) => (
                    <CustomQuestCard key={cq.id} quest={cq} />
                  ))}
                {/* Completed assigned quests */}
                {customQuests
                  .filter((q) => q.status === "completed")
                  .map((cq) => (
                    <CustomQuestCard key={cq.id} quest={cq} />
                  ))}
              </>
            )
          ) : (
            // System quest tabs
            <>
              {activeSystemQuests.length === 0 && completedSystemQuests.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: colors.slate400, py: 4, textAlign: "center" }}
                >
                  No {currentType} quests available.
                </Typography>
              )}

              {/* Active quests first */}
              {activeSystemQuests.map((quest) => (
                <SystemQuestCard key={quest.id} quest={quest} />
              ))}

              {/* Completed quests below, dimmed */}
              {completedSystemQuests.length > 0 && activeSystemQuests.length > 0 && (
                <Typography variant="overline" sx={{ color: colors.slate400, mt: 1 }}>
                  Completed
                </Typography>
              )}
              {completedSystemQuests.map((quest) => (
                <SystemQuestCard key={quest.id} quest={quest} />
              ))}
            </>
          )}
        </Box>
      </Box>
    </>
  );
}

function SystemQuestCard({ quest }: { quest: QuestData }) {
  return (
    <Card
      sx={{
        opacity: quest.completed ? 0.5 : 1,
        borderLeft: quest.completed
          ? `3px solid ${colors.success}`
          : quest.progress > 0
            ? `3px solid ${colors.info}`
            : undefined,
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{quest.icon}</Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  textDecoration: quest.completed ? "line-through" : "none",
                }}
              >
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
              {quest.completed && <CheckCircleIcon sx={{ fontSize: 18, color: colors.success }} />}
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
  );
}

function CustomQuestCard({ quest }: { quest: CustomQuestData }) {
  const isCompleted = quest.status === "completed";
  const isOverdue = quest.deadline && !isCompleted && new Date(quest.deadline) < new Date();

  return (
    <Card
      sx={{
        opacity: isCompleted ? 0.5 : 1,
        borderLeft: `3px solid ${STATUS_COLORS[quest.status] ?? colors.slate400}`,
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {quest.title}
          </Typography>
          <Chip
            label={STATUS_LABELS[quest.status] ?? quest.status}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 600,
              backgroundColor: "transparent",
              color: STATUS_COLORS[quest.status],
              border: `1px solid ${STATUS_COLORS[quest.status]}`,
            }}
          />
          <Chip
            label={quest.priority}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              backgroundColor: "transparent",
              color: PRIORITY_COLORS[quest.priority] ?? colors.slate400,
              border: `1px solid ${PRIORITY_COLORS[quest.priority] ?? colors.slate400}`,
            }}
          />
          {quest.xpReward > 0 && (
            <Chip
              label={`+${quest.xpReward} XP`}
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
          {quest.targetSkill && (
            <Chip
              label={`${quest.targetSkill} · 2x XP`}
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
          {isCompleted && <CheckCircleIcon sx={{ fontSize: 18, color: colors.success }} />}
        </Box>
        <Typography variant="body2" sx={{ color: colors.slate400 }}>
          {quest.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: colors.slate400 }}>
            From {quest.creator}
          </Typography>
          {quest.deadline && (
            <Typography
              variant="caption"
              sx={{ color: isOverdue ? colors.error : colors.slate400 }}
            >
              {isOverdue ? "Overdue: " : "Due: "}
              {new Date(quest.deadline).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
