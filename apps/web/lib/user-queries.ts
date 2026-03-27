import { prisma } from "@/lib/db";

export async function getUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      alias: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      alias: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
}
