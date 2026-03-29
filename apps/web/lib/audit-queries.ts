import { prisma } from "@/lib/db";
import { getDemoSessionId } from "@/lib/demo-session";

export interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string;
  actorName: string | null;
  details: unknown;
  createdAt: Date;
}

export async function getAuditLogs(params: {
  page: number;
  pageSize: number;
  action?: string;
  search?: string;
}): Promise<{ logs: AuditLogRow[]; total: number }> {
  const sessionId = await getDemoSessionId();

  const where: Record<string, unknown> = { sessionId };
  if (params.action) {
    where.action = params.action;
  }
  if (params.search) {
    where.OR = [
      { actorName: { contains: params.search, mode: "insensitive" } },
      { entityType: { contains: params.search, mode: "insensitive" } },
      { entityId: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.page * params.pageSize,
      take: params.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function getAuditActionTypes(): Promise<string[]> {
  const sessionId = await getDemoSessionId();
  const results = await prisma.auditLog.findMany({
    where: { sessionId },
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  });
  return results.map((r) => r.action);
}
