import { prisma } from "./db";

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
  const issues = await prisma.issueReport.findMany({
    orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
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
