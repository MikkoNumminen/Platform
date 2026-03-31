import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { resolvePermissions } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { seedDemoData, cleanupStaleDemoSessions } from "@/lib/demo-session";

const DEMO_EMAIL = "demo@platform.app";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({ authorization: { params: { prompt: "select_account" } } }),
    GitHub,
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      async authorize() {
        const user = await prisma.user.upsert({
          where: { email: DEMO_EMAIL },
          update: {},
          create: {
            email: DEMO_EMAIL,
            name: "Demo User",
            alias: "Demo User",
            role: "superuser",
            hasSeenPromotion: true,
          },
        });

        const demoSession = await prisma.demoSession.create({
          data: { userId: user.id },
        });

        try {
          await seedDemoData(demoSession.id);
        } catch (error) {
          logger.error("Demo seed failed", error, "demo");
        }

        cleanupStaleDemoSessions().catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          demoSessionId: demoSession.id,
        };
      },
    }),
  ],
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      await prisma.$transaction(
        async (tx) => {
          const existing = await tx.user.findUnique({
            where: { email: user.email! },
          });

          if (!existing) {
            const userCount = await tx.user.count({ where: { sessionId: null } });
            const role = userCount === 0 ? "superuser" : "pending";

            await tx.user.upsert({
              where: { email: user.email! },
              update: {},
              create: {
                email: user.email!,
                name: user.name ?? null,
                image: user.image ?? null,
                role,
              },
            });
          }
        },
        { isolationLevel: "Serializable" },
      );

      return true;
    },

    async jwt({ token, trigger, user }) {
      if (!token.email) return token;

      if (trigger === "signIn" && user?.demoSessionId) {
        token.demoSessionId = user.demoSessionId;
      }

      const needsRefresh =
        trigger === "signIn" || !token.role || typeof token.permissionsVersion !== "number";

      if (needsRefresh) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });

        if (!dbUser) {
          delete token.userId;
          delete token.role;
          delete token.permissions;
          return token;
        }

        token.userId = dbUser.id;
        token.alias = dbUser.alias;
        token.role = dbUser.role;
        token.developerTag = dbUser.developerTag;
        token.hasSeenPromotion = dbUser.hasSeenPromotion;
        token.permissionsVersion = dbUser.permissionsVersion;
        const overrides = dbUser.permissions.map((up) => ({
          key: up.permission.key,
          granted: up.granted,
        }));
        token.permissions = resolvePermissions(dbUser.role, overrides);

        try {
          const { recordLogin } = await import("@/lib/gamification/login-streak");
          await recordLogin(dbUser.id);
        } catch (error) {
          logger.error("Login streak error", error, "gamification");
        }
      } else {
        // Lightweight check: detect permission/role changes
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            alias: true,
            role: true,
            developerTag: true,
            hasSeenPromotion: true,
            permissionsVersion: true,
          },
        });

        if (!dbUser) {
          delete token.userId;
          delete token.role;
          delete token.permissions;
          return token;
        }

        token.alias = dbUser.alias;
        token.developerTag = dbUser.developerTag;
        token.hasSeenPromotion = dbUser.hasSeenPromotion;

        if (dbUser.permissionsVersion !== token.permissionsVersion || dbUser.role !== token.role) {
          const fullUser = await prisma.user.findUnique({
            where: { id: dbUser.id },
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          });

          if (fullUser) {
            token.alias = fullUser.alias;
            token.role = fullUser.role;
            token.hasSeenPromotion = fullUser.hasSeenPromotion;
            token.permissionsVersion = fullUser.permissionsVersion;
            const overrides = fullUser.permissions.map((up) => ({
              key: up.permission.key,
              granted: up.granted,
            }));
            token.permissions = resolvePermissions(fullUser.role, overrides);
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      session.user.alias = token.alias ?? null;
      if (token.role) session.user.role = token.role;
      session.user.hasSeenPromotion = token.hasSeenPromotion ?? true;
      if (token.permissions) session.user.permissions = token.permissions;
      session.user.developerTag = token.developerTag ?? null;
      if (token.demoSessionId) session.user.demoSessionId = token.demoSessionId;
      return session;
    },
  },
});
