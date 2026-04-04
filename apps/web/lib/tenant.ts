"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";

export type Tenant = "vuohiliitto" | "platform";

const TENANT_COOKIE = "active-tenant";
const ELEVATED_ROLES = ["superuser", "vuohi"];

/**
 * Resolves the active tenant for the current request.
 * - superuser/vuohi: reads cookie preference (default "vuohiliitto")
 * - admin/user/pending/etc: always "platform"
 * - demo users: "vuohiliitto" (demo operates within vuohiliitto tenant)
 */
export async function getActiveTenant(): Promise<Tenant> {
  const session = await auth();
  if (!session?.user) return "platform";

  const role = session.user.role ?? "";

  // Demo users always see vuohiliitto tenant
  if (session.user.demoSessionId) return "vuohiliitto";

  // Elevated roles can switch
  if (ELEVATED_ROLES.includes(role)) {
    const cookieStore = await cookies();
    const override = cookieStore.get(TENANT_COOKIE)?.value;
    if (override === "platform" || override === "vuohiliitto") return override;
    return "vuohiliitto";
  }

  // Everyone else: platform
  return "platform";
}

/**
 * Returns the tenant filter to use in Prisma queries.
 * Combines with sessionId for demo isolation.
 */
export async function getTenantFilter(): Promise<{ tenant: Tenant; sessionId: string | null }> {
  const { getDemoSessionId } = await import("@/lib/demo-session");
  const [tenant, sessionId] = await Promise.all([getActiveTenant(), getDemoSessionId()]);
  return { tenant, sessionId };
}
