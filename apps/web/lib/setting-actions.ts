"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { revalidatePath, revalidateTag } from "next/cache";

const MAX_MOTD_LENGTH = 300;

export async function setMotd(message: string): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    const role = session.user?.role;

    // Only superuser and architects can change MOTD
    if (role !== "superuser") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { developerTag: true },
      });
      if (user?.developerTag !== "architect") {
        throw new ActionError(
          "permissionDenied",
          "Only superuser and architects can change the MOTD",
        );
      }
    }

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > MAX_MOTD_LENGTH) {
      throw new ActionError("invalidInput", `MOTD must be 1-${MAX_MOTD_LENGTH} characters`);
    }

    await prisma.platformSetting.upsert({
      where: { key: "motd" },
      create: { key: "motd", value: trimmed },
      update: { value: trimmed },
    });

    revalidateTag("motd");
    revalidatePath("/");
  });
}
