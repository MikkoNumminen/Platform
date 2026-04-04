import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ManageGamification from "./ManageGamification";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Achievements & Quests" };

const ALLOWED_ROLES = ["superuser", "vuohi"];

export default async function ManageGamificationPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect("/");
  }

  const [achievements, rawQuests] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.quest.findMany({
      where: { type: { notIn: ["assigned", "campaign"] }, deletedAt: null },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <ManageGamification
      achievements={achievements.map((a) => ({
        ...a,
        criteria: a.criteria as Record<string, unknown>,
      }))}
      quests={rawQuests.map((q) => ({
        id: q.id,
        key: q.key,
        name: q.name,
        description: q.description,
        icon: q.icon,
        type: q.type,
        xpReward: q.xpReward,
        criteria: q.criteria as Record<string, unknown> | null,
        repeatable: q.repeatable,
        sortOrder: q.sortOrder,
      }))}
    />
  );
}
