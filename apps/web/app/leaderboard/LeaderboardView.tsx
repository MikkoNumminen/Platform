"use client";

import { Avatar, Box, Card, CardContent, LinearProgress, Typography } from "@mui/material";
import TopBar from "../components/TopBar";
import { colors } from "../styles";
import type { LevelThreshold } from "@/lib/gamification/xp-config";
import { LEVEL_THRESHOLDS } from "@/lib/gamification/xp-config";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  alias: string | null;
  name: string | null;
  image: string | null;
  role: string;
  totalXp: number;
  level: number;
}

interface XpProgress {
  current: LevelThreshold;
  next: LevelThreshold | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  xpProgress: XpProgress;
}

const MEDAL_EMOJIS: Record<number, string> = {
  1: "\uD83E\uDD47",
  2: "\uD83E\uDD48",
  3: "\uD83E\uDD49",
};

function getLevelTitle(level: number): string {
  return LEVEL_THRESHOLDS.find((l) => l.level === level)?.title ?? "Newcomer";
}

export default function LeaderboardView({
  entries,
  currentUserId,
  xpProgress,
}: LeaderboardViewProps) {
  return (
    <>
      <TopBar title="Leaderboard" backHref="/" />
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
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Box
          data-tutorial="leaderboard-list"
          sx={{ display: "flex", flexDirection: "column", gap: 1 }}
        >
          {entries.length === 0 && (
            <Typography variant="body2" sx={{ color: colors.slate400, py: 4, textAlign: "center" }}>
              No one on the leaderboard yet. Start earning XP!
            </Typography>
          )}
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const medal = MEDAL_EMOJIS[entry.rank];

            return (
              <Card
                key={entry.userId}
                sx={{
                  border: isCurrentUser ? `2px solid ${colors.green400}` : undefined,
                  boxShadow: isCurrentUser ? `0 0 12px ${colors.accentGlow}` : undefined,
                }}
              >
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Rank */}
                    <Box
                      sx={{
                        minWidth: 40,
                        textAlign: "center",
                        fontSize: medal ? "1.3rem" : "1rem",
                        fontWeight: 700,
                        color: medal ? undefined : colors.slate400,
                      }}
                    >
                      {medal ?? `#${entry.rank}`}
                    </Box>

                    {/* Avatar */}
                    <Avatar
                      src={entry.image ?? undefined}
                      alt={entry.alias ?? entry.name ?? "User"}
                      sx={{
                        width: 40,
                        height: 40,
                        border: isCurrentUser
                          ? `2px solid ${colors.green400}`
                          : "2px solid transparent",
                      }}
                    />

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: isCurrentUser ? colors.green400 : undefined }}
                        noWrap
                      >
                        {entry.alias ?? entry.name ?? "Anonymous"}
                        {isCurrentUser && " (you)"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.slate400 }}>
                        Level {entry.level} — {getLevelTitle(entry.level)}
                      </Typography>
                    </Box>

                    {/* XP */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: colors.green400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.totalXp.toLocaleString()} XP
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
