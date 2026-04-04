import { prisma } from "./db";
import { getTenantFilter } from "@/lib/tenant";

export interface IssueData {
  id: string;
  title: string;
  description: string;
  url: string | null;
  authorAlias: string;
  resolved: boolean;
  createdAt: Date;
}

export async function getIssueReports(): Promise<IssueData[]> {
  const { tenant, sessionId } = await getTenantFilter();
  const issues = await prisma.issueReport.findMany({
    where: { tenant, sessionId },
    orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { author: { select: { alias: true, name: true } } },
  });

  return issues.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    url: i.url,
    authorAlias: i.author.alias ?? i.author.name ?? "Unknown",
    resolved: i.resolvedAt !== null,
    createdAt: i.createdAt,
  }));
}
