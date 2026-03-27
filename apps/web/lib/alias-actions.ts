"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";

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
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

    const trimmed = alias.trim();
    validateAlias(trimmed);

    const existing = await prisma.user.findFirst({
      where: { alias: trimmed, id: { not: session.user.id } },
    });

    if (existing) {
      throw new ActionError("conflict", "This alias is already taken");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { alias: trimmed },
    });
  });
}
