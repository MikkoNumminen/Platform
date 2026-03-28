export const dynamic = "force-dynamic";

import { Box, Chip, Typography } from "@mui/material";
import TopBar from "../../components/TopBar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllCustomQuests, getCustomQuestCounts } from "@/lib/custom-quest-queries";
import { getUsers } from "@/lib/user-queries";
import { colors } from "../../styles";
import QuestListClient from "./QuestListClient";

export default async function AdminQuestsPage() {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};

  if (!permissions["quest:view"] && !permissions["quest:manage"]) {
    redirect("/");
  }

  const canManage = Boolean(permissions["quest:manage"]);
  const [quests, counts, users] = await Promise.all([
    getAllCustomQuests(),
    getCustomQuestCounts(),
    canManage ? getUsers() : Promise.resolve([]),
  ]);

  return (
    <>
      <TopBar title="Quest Board" backHref="/" />
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1, sm: 2 }, py: 2 }}>
        {/* Summary chips */}
        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          <StatChip label="Open" count={counts.open} color={colors.warning} />
          <StatChip label="In Progress" count={counts.inProgress} color={colors.info} />
          <StatChip label="Completed" count={counts.completed} color={colors.success} />
          <StatChip label="Total" count={counts.total} color={colors.slate400} />
        </Box>

        <QuestListClient
          initialQuests={quests.map((q) => ({
            ...q,
            deadline: q.deadline?.toISOString() ?? null,
            completedAt: q.completedAt?.toISOString() ?? null,
            createdAt: q.createdAt.toISOString(),
          }))}
          users={users.map((u) => ({ id: u.id, alias: u.alias, name: u.name }))}
          canManage={canManage}
        />
      </Box>
    </>
  );
}

function StatChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Chip
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color }}>
            {count}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.slate400 }}>
            {label}
          </Typography>
        </Box>
      }
      sx={{
        backgroundColor: colors.surfaceOverlay,
        border: `1px solid ${colors.slate400}`,
        height: 32,
      }}
    />
  );
}
