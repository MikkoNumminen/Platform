"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { guardedAction } from "@/lib/guardedAction";
import { ActionError } from "@/lib/actionErrors";
import { validateUUID } from "@/lib/actionUtils";
import { ROLES } from "@/lib/permissions";

const PROTECTED_ROLES = ["superuser", "vuohi"] as const;

export const updateUserRole = guardedAction(
  "admin:users",
  "admin:updateRole",
  async (userId: string, role: string) => {
    validateUUID(userId, "user ID");

    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      throw new ActionError("invalidId", `Invalid role: ${role}`);
    }

    const session = await auth();
    const actorRole = (session?.user as { role?: string })?.role;

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new ActionError("notFound", "User not found");
    }

    // Only superusers can modify superuser or vuohi members
    if (
      actorRole !== "superuser" &&
      (PROTECTED_ROLES.includes(user.role as (typeof PROTECTED_ROLES)[number]) ||
        PROTECTED_ROLES.includes(role as (typeof PROTECTED_ROLES)[number]))
    ) {
      throw new ActionError(
        "permissionDenied",
        "Only superusers can modify or assign protected roles",
      );
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
