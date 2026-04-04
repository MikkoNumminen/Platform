"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Tenant } from "./tenant";

const TENANT_COOKIE = "active-tenant";
const ELEVATED_ROLES = ["superuser", "vuohi"];

export async function switchTenant(tenant: Tenant): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const role = session.user.role ?? "";
  if (!ELEVATED_ROLES.includes(role)) {
    return { error: "Not authorized to switch tenants" };
  }

  if (tenant !== "vuohiliitto" && tenant !== "platform") {
    return { error: "Invalid tenant" };
  }

  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE, tenant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return {};
}
