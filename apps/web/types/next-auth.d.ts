import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    alias?: string | null;
    role?: string;
    hasSeenPromotion?: boolean;
    permissions?: Record<string, boolean>;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      alias?: string | null;
      role?: string;
      hasSeenPromotion?: boolean;
      permissions?: Record<string, boolean>;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    alias?: string | null;
    role?: string;
    hasSeenPromotion?: boolean;
    permissionsVersion?: number;
    permissions?: Record<string, boolean>;
  }
}
