import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ManageGamification from "./ManageGamification";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Achievements & Quests" };

export default async function ManageGamificationPage() {
  const session = await auth();
  const permissions = (session?.user?.permissions as Record<string, boolean>) ?? {};
  if (!permissions["admin:users"]) {
    redirect("/");
  }

  const [achievements, quests] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.quest.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] }),
  ]);

  return (
    <ManageGamification
      achievements={achievements.map((a) => ({
        ...a,
        criteria: a.criteria as Record<string, unknown>,
      }))}
      quests={quests.map((q) => ({ ...q, criteria: q.criteria as Record<string, unknown> }))}
    />
  );
}
