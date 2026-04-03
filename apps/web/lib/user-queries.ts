import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";
import { DEMO_EMAIL } from "@/lib/demo-constants";

export async function getUsers() {
  const sessionId = await getDemoSessionId();
  return prisma.user.findMany({
    where: { deletedAt: null, sessionId, email: { not: DEMO_EMAIL } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      alias: true,
      image: true,
      role: true,
      wantsToDevelop: true,
      developerTag: true,
      developmentSkills: true,
      createdAt: true,
    },
  });
}

export async function getUserPermissionOverrides(
  userId: string,
): Promise<Array<{ key: string; granted: boolean }>> {
  const overrides = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });
  return overrides.map((o) => ({ key: o.permission.key, granted: o.granted }));
}

export async function getUsersWithOverrides(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const overrides = await prisma.userPermission.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
    distinct: ["userId"],
  });

  return new Set(overrides.map((o) => o.userId));
}

export async function getUserById(id: string) {
  const sessionId = await getDemoSessionId();
  return prisma.user.findFirst({
    where: { id, deletedAt: null, sessionId },
    select: {
      id: true,
      email: true,
      name: true,
      alias: true,
      image: true,
      role: true,
      wantsToDevelop: true,
      developerTag: true,
      developmentSkills: true,
      createdAt: true,
    },
  });
}
