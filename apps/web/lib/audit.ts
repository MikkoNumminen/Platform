"use server";

import { prisma } from "@/lib/db";
import { getTenantFilter } from "@/lib/tenant";
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
    const { tenant, sessionId } = await getTenantFilter();
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        actorId: entry.actorId,
        actorName: entry.actorName ?? null,
        details: (entry.details as Prisma.InputJsonValue) ?? undefined,
        tenant,
        sessionId,
      },
    });
  } catch (err) {
    logger.error("Failed to write audit log", err, "audit");
  }
}
