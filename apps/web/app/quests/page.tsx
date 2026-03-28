import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveQuests, getUserXpData, getXpProgress } from "@/lib/gamification";
import QuestLog from "./QuestLog";

export const metadata = { title: "Quest Log" };

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const [quests, xpData] = await Promise.all([
    getActiveQuests(session.user.id),
    getUserXpData(session.user.id),
  ]);
  const progress = getXpProgress(xpData.totalXp);
  return <QuestLog quests={quests} xpProgress={progress} />;
}
