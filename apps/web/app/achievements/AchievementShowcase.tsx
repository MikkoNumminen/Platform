"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import TopBar from "../components/TopBar";
import { colors } from "../styles";
import type { LevelThreshold } from "@/lib/gamification/xp-config";

interface AchievementData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: string | null;
  category: string;
  xpReward: number;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt: Date | null;
}

interface XpProgress {
  current: LevelThreshold;
  next: LevelThreshold | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

interface AchievementShowcaseProps {
  achievements: AchievementData[];
  xpProgress: XpProgress;
}

const TIER_COLORS: Record<string, string> = {
  bronze: colors.tierBronze,
  silver: colors.tierSilver,
  gold: colors.tierGold,
  legendary: colors.tierLegendary,
};

const CATEGORY_TABS = ["all", "onboarding", "content", "social", "moderation", "special"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  onboarding: "Onboarding",
  content: "Content",
  social: "Social",
  moderation: "Moderation",
  special: "Special",
};

export default function AchievementShowcase({
  achievements,
  xpProgress,
}: AchievementShowcaseProps) {
  const [tab, setTab] = useState(0);
  const currentCategory = CATEGORY_TABS[tab];
  const filtered =
    currentCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === currentCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <TopBar title="Achievements" backHref="/" />
      <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        {/* XP Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Level {xpProgress.current.level} — {xpProgress.current.title}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.slate400 }}>
                {unlockedCount} / {achievements.length} unlocked
              </Typography>
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
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            "& .MuiTab-root": { color: colors.slate400 },
            "& .Mui-selected": { color: colors.green400 },
            "& .MuiTabs-indicator": { backgroundColor: colors.green400 },
          }}
        >
          {CATEGORY_TABS.map((c) => (
            <Tab key={c} label={CATEGORY_LABELS[c]} />
          ))}
        </Tabs>

        {/* Achievement Grid */}
        <Box
          data-tutorial="achievement-grid"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {filtered.map((achievement) => {
            const tierColor = achievement.tier ? TIER_COLORS[achievement.tier] : undefined;
            const isLocked = !achievement.unlocked;

            return (
              <Tooltip
                key={achievement.id}
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {achievement.name}
                    </Typography>
                    <Typography variant="caption">{achievement.description}</Typography>
                    {achievement.xpReward > 0 && (
                      <Typography variant="caption" display="block" sx={{ color: colors.green400 }}>
                        +{achievement.xpReward} XP
                      </Typography>
                    )}
                    {achievement.unlockedAt && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Card
                  sx={{
                    textAlign: "center",
                    opacity: isLocked ? 0.35 : 1,
                    filter: isLocked ? "grayscale(1)" : "none",
                    border: tierColor ? `2px solid ${tierColor}` : undefined,
                    boxShadow:
                      tierColor && !isLocked
                        ? `0 0 12px ${tierColor}40, 0 0 4px ${tierColor}20`
                        : undefined,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: isLocked ? "none" : "translateY(-2px)",
                      boxShadow:
                        tierColor && !isLocked
                          ? `0 0 20px ${tierColor}60, 0 0 8px ${tierColor}30`
                          : undefined,
                    },
                  }}
                >
                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>{achievement.icon}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: tierColor ?? colors.slate100,
                        lineHeight: 1.2,
                        mb: 0.5,
                      }}
                    >
                      {achievement.name}
                    </Typography>
                    {achievement.tier && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: tierColor,
                          textTransform: "capitalize",
                          fontWeight: 500,
                        }}
                      >
                        {achievement.tier}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Tooltip>
            );
          })}
        </Box>

        {filtered.length === 0 && (
          <Typography variant="body2" sx={{ color: colors.slate400, py: 4, textAlign: "center" }}>
            No achievements in this category.
          </Typography>
        )}
      </Box>
    </>
  );
}
