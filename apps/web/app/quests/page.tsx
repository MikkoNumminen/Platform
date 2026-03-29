import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveQuests, getUserXpData, getXpProgress } from "@/lib/gamification";
import { getMyCustomQuests } from "@/lib/custom-quest-queries";
import QuestLog from "./QuestLog";

export const metadata = { title: "Quest Log" };

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  let customQuests: Awaited<ReturnType<typeof getMyCustomQuests>> = [];
  try {
    customQuests = await getMyCustomQuests();
  } catch {
    // CustomQuest table may not exist yet
  }

  const [quests, xpData] = await Promise.all([
    getActiveQuests(session.user.id),
    getUserXpData(session.user.id),
  ]);
  const progress = getXpProgress(xpData.totalXp);

  const permissions = (session.user.permissions as Record<string, boolean>) ?? {};
  const canManageQuests = Boolean(permissions["quest:manage"] || permissions["quest:view"]);

  return (
    <QuestLog
      quests={quests}
      xpProgress={progress}
      customQuests={customQuests.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        xpReward: q.xpReward,
        status: q.status,
        priority: q.priority,
        targetSkill: q.targetSkill,
        deadline: q.deadline?.toISOString() ?? null,
        completedAt: q.completedAt?.toISOString() ?? null,
        creator: q.creator.alias ?? q.creator.name ?? "Unknown",
      }))}
      canManageQuests={canManageQuests}
    />
  );
}
