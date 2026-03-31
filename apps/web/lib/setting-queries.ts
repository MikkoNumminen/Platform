"use server";

import { prisma } from "@/lib/db";

const DEFAULT_MOTD = "Welcome. Type /help for commands.";

export async function getMotd(): Promise<string> {
  const setting = await prisma.platformSetting.findUnique({ where: { key: "motd" } });
  return setting?.value ?? DEFAULT_MOTD;
}
