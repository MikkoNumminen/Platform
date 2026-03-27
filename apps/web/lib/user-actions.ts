"use server";

import { prisma } from "@/lib/db";
import { guardedAction } from "@/lib/guardedAction";
import { ActionError } from "@/lib/actionErrors";
import { validateUUID } from "@/lib/actionUtils";
import { ROLES } from "@/lib/permissions";

export const updateUserRole = guardedAction(
  "admin:users",
  "admin:updateRole",
  async (userId: string, role: string) => {
    validateUUID(userId, "user ID");

    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      throw new ActionError("invalidId", `Invalid role: ${role}`);
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new ActionError("notFound", "User not found");
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
