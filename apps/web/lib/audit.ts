"use server";

import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId: string;
  actorName?: string | null;
  details?: Record<string, unknown> | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const sessionId = await getDemoSessionId();
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        actorId: entry.actorId,
        actorName: entry.actorName ?? null,
        details: (entry.details as Prisma.InputJsonValue) ?? undefined,
        sessionId,
      },
    });
  } catch (err) {
    logger.error("Failed to write audit log", err, "audit");
  }
}
