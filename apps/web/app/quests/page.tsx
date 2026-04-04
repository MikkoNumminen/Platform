import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveQuests, getUserXpData, getXpProgress } from "@/lib/gamification";
import { getMyCustomQuests, getAllCustomQuests } from "@/lib/custom-quest-queries";
import { getUsers } from "@/lib/user-queries";
import QuestLog from "./QuestLog";

export const metadata = { title: "Quest Log" };

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const permissions = (session.user.permissions as Record<string, boolean>) ?? {};
  const canManageQuests = Boolean(permissions["quest:manage"]);
  const canViewQuestBoard = Boolean(permissions["quest:view"] || permissions["quest:manage"]);

  let customQuests: Awaited<ReturnType<typeof getMyCustomQuests>> = [];
  let allQuests: Awaited<ReturnType<typeof getAllCustomQuests>> = [];
  let users: { id: string; alias: string | null; name: string | null }[] = [];

  try {
    customQuests = await getMyCustomQuests();
    if (canViewQuestBoard) {
      allQuests = await getAllCustomQuests();
    }
    if (canManageQuests) {
      const allUsers = await getUsers();
      users = allUsers.map((u) => ({ id: u.id, alias: u.alias, name: u.name }));
    }
  } catch {
    // CustomQuest table may not exist yet
  }

  const [quests, xpData] = await Promise.all([
    getActiveQuests(session.user.id),
    getUserXpData(session.user.id),
  ]);
  const progress = getXpProgress(xpData.totalXp);

  const serializeQuest = (q: (typeof allQuests)[0]) => ({
    id: q.id,
    title: q.title,
    description: q.description ?? "",
    xpReward: q.xpReward,
    status: q.status,
    priority: q.priority,
    targetSkill: q.targetSkill,
    deadline: q.deadline?.toISOString() ?? null,
    completedAt: q.completedAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
    assignee: q.assignee,
    creator: q.creator,
  });

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
      questBoard={
        canViewQuestBoard
          ? {
              quests: allQuests.map(serializeQuest),
              users,
              canManage: canManageQuests,
            }
          : undefined
      }
    />
  );
}
