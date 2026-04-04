import type { Tenant } from "./tenant";

/**
 * Client-side hook to read the active tenant from the cookie.
 * - superuser: reads cookie (default vuohiliitto), can switch
 * - vuohi: always vuohiliitto (locked)
 * - everyone else: always platform
 */
export function useActiveTenant(role: string, isDemoUser: boolean): Tenant {
  if (isDemoUser) return "vuohiliitto";
  if (role === "vuohi") return "vuohiliitto";

  if (role === "superuser") {
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
