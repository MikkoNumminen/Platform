import { Box, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { colors } from "../styles";

interface CompletedQuest {
  id: string;
  title: string;
  xpReward: number;
  completedAt: string;
  assignee: string;
}

export default function CompletedQuestsFeed({ quests }: { quests: CompletedQuest[] }) {
  if (quests.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        backgroundColor: colors.slate700,
        border: `1px solid ${colors.slate300}`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${colors.slate300}`,
          backgroundColor: colors.slate600,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: 16, color: colors.green400 }} />
        <Typography
          variant="caption"
          sx={{ color: colors.slate400, fontWeight: 600, letterSpacing: "0.02em" }}
        >
          Completed Quests
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, py: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {quests.map((q) => (
          <Box
            key={q.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 0.25,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: colors.green400,
                fontWeight: 700,
                fontSize: "0.8rem",
                flexShrink: 0,
              }}
            >
              {q.assignee}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.slate100,
                fontSize: "0.8rem",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {q.title}
            </Typography>
            {q.xpReward > 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: colors.green400,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  flexShrink: 0,
                }}
              >
                +{q.xpReward} XP
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
