"use server";

import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

const DEFAULT_MOTD = "Welcome. Type /help for commands.";

const getCachedMotd = unstable_cache(
  async () => {
    const setting = await prisma.platformSetting.findUnique({ where: { key: "motd" } });
    return setting?.value ?? DEFAULT_MOTD;
  },
  ["motd"],
  { revalidate: 300 }, // 5 minutes
);

export async function getMotd(): Promise<string> {
  try {
    return await getCachedMotd();
  } catch {
    return DEFAULT_MOTD;
  }
}
