import { Box, Card, CardContent, LinearProgress, Typography } from "@mui/material";
import { colors } from "../styles";
import type { LevelThreshold } from "@/lib/gamification/xp-config";

export interface XpProgress {
  current: LevelThreshold;
  next: LevelThreshold | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

interface XpProgressCardProps {
  xpProgress: XpProgress;
  rightLabel?: React.ReactNode;
  showNextLevel?: boolean;
}

export default function XpProgressCard({
  xpProgress,
  rightLabel,
  showNextLevel = false,
}: XpProgressCardProps) {
  const defaultRight = xpProgress.next ? (
    <Typography variant="body2" sx={{ color: colors.slate400 }}>
      {xpProgress.xpIntoLevel} / {xpProgress.xpForNextLevel} XP
    </Typography>
  ) : null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Level {xpProgress.current.level} — {xpProgress.current.title}
          </Typography>
          {rightLabel !== undefined ? rightLabel : defaultRight}
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
        {showNextLevel && xpProgress.next && (
          <Typography variant="caption" sx={{ color: colors.slate400, mt: 0.5, display: "block" }}>
            Next: Level {xpProgress.next.level} — {xpProgress.next.title}
          </Typography>
        )}
        {showNextLevel && !xpProgress.next && (
          <Typography variant="caption" sx={{ color: colors.green400, mt: 0.5, display: "block" }}>
            Max level reached!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
