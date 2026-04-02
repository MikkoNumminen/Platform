"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, requireUser, type ActionResult } from "@/lib/actionUtils";
import { triggerGamification } from "./gamification/trigger";

const ALIAS_MIN_LENGTH = 2;
const ALIAS_MAX_LENGTH = 30;
const ALIAS_PATTERN = /^[a-zA-Z0-9_-]+$/;

function validateAlias(alias: string): void {
  const trimmed = alias.trim();

  if (trimmed.length < ALIAS_MIN_LENGTH || trimmed.length > ALIAS_MAX_LENGTH) {
    throw new ActionError(
      "invalidInput",
      `Alias must be between ${ALIAS_MIN_LENGTH} and ${ALIAS_MAX_LENGTH} characters`,
    );
  }

  if (!ALIAS_PATTERN.test(trimmed)) {
    throw new ActionError(
      "invalidInput",
      "Alias can only contain letters, numbers, hyphens, and underscores",
    );
  }
}

export async function setAlias(alias: string): Promise<ActionResult> {
  return safe(async () => {
    const user = await requireUser();
    const trimmed = alias.trim();
    validateAlias(trimmed);

    const existing = await prisma.user.findFirst({
      where: { alias: trimmed, id: { not: user.id } },
    });

    if (existing) {
      throw new ActionError("conflict", "This alias is already taken");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { alias: trimmed },
    });

    await triggerGamification(user.id, "alias:set");
  });
}

export async function toggleWantsToDevelop(value: boolean): Promise<ActionResult> {
  return safe(async () => {
    const user = await requireUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { wantsToDevelop: value },
    });
  });
}

export async function getMyDeveloperInfo(): Promise<{
  wantsToDevelop: boolean;
  developerTag: string | null;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { wantsToDevelop: true, developerTag: true },
  });

  return user ? { wantsToDevelop: user.wantsToDevelop, developerTag: user.developerTag } : null;
}
