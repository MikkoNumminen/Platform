export const dynamic = "force-dynamic";

import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import TopBar from "../components/TopBar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyCustomQuests } from "@/lib/custom-quest-queries";
import { colors } from "../styles";

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

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: colors.slate400,
  normal: colors.info,
  high: colors.warning,
  urgent: colors.error,
};

export default async function MyQuestsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const quests = await getMyCustomQuests();

  const activeQuests = quests.filter((q) => q.status !== "completed");
  const completedQuests = quests.filter((q) => q.status === "completed");

  return (
    <>
      <TopBar title="My Quests" backHref="/" />
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        {quests.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" sx={{ color: colors.slate400, mb: 1 }}>
              No quests assigned yet
            </Typography>
            <Typography variant="body2" sx={{ color: colors.slate400 }}>
              When the team lead assigns you a quest, it will appear here.
            </Typography>
          </Box>
        ) : (
          <>
            {activeQuests.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="overline"
                  sx={{ color: colors.green400, fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  Active ({activeQuests.length})
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                  {activeQuests.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </Box>
              </Box>
            )}

            {completedQuests.length > 0 && (
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: colors.slate400, fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  Completed ({completedQuests.length})
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                  {completedQuests.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
}

function QuestCard({
  quest,
}: {
  quest: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    status: string;
    priority: string;
    deadline: Date | null;
    completedAt: Date | null;
    creator: { alias: string | null; name: string | null };
  };
}) {
  const isCompleted = quest.status === "completed";
  const isOverdue = quest.deadline && !isCompleted && new Date(quest.deadline) < new Date();

  return (
    <Card
      sx={{
        opacity: isCompleted ? 0.6 : 1,
        borderLeft: `3px solid ${STATUS_COLORS[quest.status] ?? colors.slate400}`,
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              textDecoration: isCompleted ? "line-through" : "none",
              color: colors.slate100,
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
              color: STATUS_COLORS[quest.status] ?? colors.slate400,
              border: `1px solid ${STATUS_COLORS[quest.status] ?? colors.slate400}`,
            }}
          />
          <Chip
            label={PRIORITY_LABELS[quest.priority] ?? quest.priority}
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
        </Box>
        <Typography variant="body2" sx={{ color: colors.slate400, mb: 0.5 }}>
          {quest.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="caption" sx={{ color: colors.slate400 }}>
            From {quest.creator.alias ?? quest.creator.name ?? "Unknown"}
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
          {quest.completedAt && (
            <Typography variant="caption" sx={{ color: colors.success }}>
              Completed {new Date(quest.completedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
