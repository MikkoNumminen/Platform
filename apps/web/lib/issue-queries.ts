import { prisma } from "./db";
import { getDemoSessionId } from "@/lib/demo-session";

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
  const sessionId = await getDemoSessionId();
  const issues = await prisma.issueReport.findMany({
    where: { sessionId },
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
