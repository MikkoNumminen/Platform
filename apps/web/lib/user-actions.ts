"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { guardedAction } from "@/lib/guardedAction";
import { ActionError } from "@/lib/actionErrors";
import { validateUUID } from "@/lib/actionUtils";
import { ROLES } from "@/lib/permissions";

// ROLES is ordered highest → lowest: superuser, vuohi, admin, user, pending
function roleRank(role: string): number {
  const index = ROLES.indexOf(role as (typeof ROLES)[number]);
  return index === -1 ? ROLES.length : index;
}

export const updateUserRole = guardedAction(
  "admin:users",
  "admin:updateRole",
  async (userId: string, role: string) => {
    validateUUID(userId, "user ID");

    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      throw new ActionError("invalidId", `Invalid role: ${role}`);
    }

    const session = await auth();
    const actorRole = (session?.user as { role?: string })?.role ?? "pending";
    const actorRank = roleRank(actorRole);

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new ActionError("notFound", "User not found");
    }

    // Cannot modify users at same or higher rank
    if (roleRank(user.role) <= actorRank) {
      throw new ActionError("permissionDenied", "Cannot modify a user at the same or higher rank");
    }

    // Cannot assign a role at same or higher rank than your own
    if (roleRank(role) <= actorRank) {
      throw new ActionError("permissionDenied", "Cannot assign a role at the same or higher rank");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        permissionsVersion: { increment: 1 },
      },
    });
  },
);
