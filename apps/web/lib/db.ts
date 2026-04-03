import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Lazy initialization — avoids crashing at build time when DATABASE_URL is absent
export const prisma =
  globalForPrisma.prisma ||
  (process.env.DATABASE_URL
    ? createPrismaClient()
    : (new Proxy(
        {},
        {
          get() {
            throw new Error("DATABASE_URL environment variable is required");
          },
        },
      ) as PrismaClient));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
