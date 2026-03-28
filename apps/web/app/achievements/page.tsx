import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllAchievementsWithStatus, getUserXpData, getXpProgress } from "@/lib/gamification";
import AchievementShowcase from "./AchievementShowcase";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const [achievements, xpData] = await Promise.all([
    getAllAchievementsWithStatus(session.user.id),
    getUserXpData(session.user.id),
  ]);
  const progress = getXpProgress(xpData.totalXp);
  return <AchievementShowcase achievements={achievements} xpProgress={progress} />;
}
