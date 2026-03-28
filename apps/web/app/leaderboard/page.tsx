import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLeaderboard, getUserXpData, getXpProgress } from "@/lib/gamification";
import LeaderboardView from "./LeaderboardView";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [entries, xpData] = await Promise.all([getLeaderboard(50), getUserXpData(session.user.id)]);

  const progress = getXpProgress(xpData.totalXp);

  return (
    <LeaderboardView entries={entries} currentUserId={session.user.id} xpProgress={progress} />
  );
}
