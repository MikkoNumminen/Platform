import type { Tenant } from "./tenant";

const ELEVATED_ROLES = ["superuser", "vuohi"];

/**
 * Client-side hook to read the active tenant from the cookie.
 * Falls back based on role if cookie is not set.
 */
export function useActiveTenant(role: string, isDemoUser: boolean): Tenant {
  if (isDemoUser) return "vuohiliitto";

  if (ELEVATED_ROLES.includes(role)) {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)active-tenant=(\w+)/);
      if (match) {
        const value = match[1];
        if (value === "platform" || value === "vuohiliitto") return value;
      }
    }
    return "vuohiliitto";
  }

  return "platform";
}
