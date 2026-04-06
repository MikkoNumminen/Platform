"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";

const DEFAULT_MOTD = "Welcome. Type /help for commands.";

const fetchMotd = unstable_cache(
  async (tenant: string): Promise<string> => {
    try {
      const setting = await prisma.platformSetting.findUnique({
        where: { tenant_key: { tenant, key: "motd" } },
      });
      return setting?.value ?? DEFAULT_MOTD;
    } catch {
      return DEFAULT_MOTD;
    }
  },
  ["motd"],
  { revalidate: 60 * 60 * 24, tags: ["motd"] },
);

export async function getMotd(): Promise<string> {
  const { tenant } = await getTenantFilter();
  return fetchMotd(tenant);
}
