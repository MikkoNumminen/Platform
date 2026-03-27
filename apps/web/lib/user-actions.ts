"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { guardedAction } from "@/lib/guardedAction";
import { ActionError } from "@/lib/actionErrors";
import { validateUUID } from "@/lib/actionUtils";
import { ROLES, PERMISSIONS, type PermissionKey } from "@/lib/permissions";

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

export async function fetchUserPermissionOverrides(
  userId: string,
): Promise<Array<{ key: string; granted: boolean }>> {
  const session = await auth();
  const permissions = (session?.user as { permissions?: Record<string, boolean> })?.permissions;
  if (!permissions?.["admin:users"]) return [];

  const overrides = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });
  return overrides.map((o) => ({ key: o.permission.key, granted: o.granted }));
}

export const updateUserPermissions = guardedAction(
  "admin:users",
  "admin:updatePermissions",
  async (userId: string, overrides: Array<{ key: string; granted: boolean }>) => {
    validateUUID(userId, "user ID");

    const session = await auth();
    const actorRole = (session?.user as { role?: string })?.role ?? "pending";
    const actorRank = roleRank(actorRole);

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new ActionError("notFound", "User not found");
    }

    if (roleRank(user.role) <= actorRank) {
      throw new ActionError("permissionDenied", "Cannot modify a user at the same or higher rank");
    }

    const validKeys = Object.keys(PERMISSIONS) as PermissionKey[];

    // Ensure all permission keys exist in the Permission table
    for (const key of validKeys) {
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, description: PERMISSIONS[key] },
      });
    }

    // Delete all existing overrides for this user
    await prisma.userPermission.deleteMany({ where: { userId } });

    // Insert new overrides
    for (const override of overrides) {
      if (!validKeys.includes(override.key as PermissionKey)) continue;

      const permission = await prisma.permission.findUnique({
        where: { key: override.key },
      });
      if (!permission) continue;

      await prisma.userPermission.create({
        data: {
          userId,
          permissionId: permission.id,
          granted: override.granted,
        },
      });
    }

    // Bump permissionsVersion so JWT refreshes
    await prisma.user.update({
      where: { id: userId },
      data: { permissionsVersion: { increment: 1 } },
    });
  },
);
