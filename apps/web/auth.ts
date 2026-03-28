import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";
import { resolvePermissions } from "@/lib/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ authorization: { params: { prompt: "select_account" } } }), GitHub],
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
            const userCount = await tx.user.count();
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

    async jwt({ token, trigger }) {
      if (!token.email) return token;

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
        token.hasSeenPromotion = dbUser.hasSeenPromotion;
        token.permissionsVersion = dbUser.permissionsVersion;
        const overrides = dbUser.permissions.map((up) => ({
          key: up.permission.key,
          granted: up.granted,
        }));
        token.permissions = resolvePermissions(dbUser.role, overrides);
      } else {
        // Lightweight check: detect permission/role changes
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            alias: true,
            role: true,
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
      return session;
    },
  },
});
