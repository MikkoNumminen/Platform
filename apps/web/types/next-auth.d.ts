import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    alias?: string | null;
    role?: string;
    developerTag?: string | null;
    hasSeenPromotion?: boolean;
    permissions?: Record<string, boolean>;
    demoSessionId?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      alias?: string | null;
      role?: string;
      developerTag?: string | null;
      hasSeenPromotion?: boolean;
      permissions?: Record<string, boolean>;
      demoSessionId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    alias?: string | null;
    role?: string;
    developerTag?: string | null;
    hasSeenPromotion?: boolean;
    permissionsVersion?: number;
    permissions?: Record<string, boolean>;
    demoSessionId?: string;
    lastDbSync?: number;
  }
}
