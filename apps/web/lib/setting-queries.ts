"use server";

import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";

const DEFAULT_MOTD = "Welcome. Type /help for commands.";

export async function getMotd(): Promise<string> {
  try {
    const { tenant } = await getTenantFilter();
    const setting = await prisma.platformSetting.findUnique({
      where: { tenant_key: { tenant, key: "motd" } },
    });
    return setting?.value ?? DEFAULT_MOTD;
  } catch {
    return DEFAULT_MOTD;
  }
}
