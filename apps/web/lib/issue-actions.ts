"use server";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/actionErrors";
import { safe, requireUser, validateUUID, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import { guardedAction } from "@/lib/guardedAction";
import { triggerGamification } from "@/lib/gamification/trigger";
import { getTenantFilter } from "@/lib/tenant";
import { logAudit } from "@/lib/audit";

const MAX_ISSUE_TITLE_LENGTH = 200;
const MAX_ISSUE_DESCRIPTION_LENGTH = 2000;

export async function createIssueReport(
  title: string,
  description: string,
  url?: string,
): Promise<ActionResult> {
  return safe(async () => {
    const user = await requireUser();

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle || trimmedTitle.length > MAX_ISSUE_TITLE_LENGTH) {
      throw new ActionError("invalidInput", `Title must be 1-${MAX_ISSUE_TITLE_LENGTH} characters`);
    }

    if (!trimmedDesc || trimmedDesc.length > MAX_ISSUE_DESCRIPTION_LENGTH) {
      throw new ActionError(
        "invalidInput",
        `Description must be 1-${MAX_ISSUE_DESCRIPTION_LENGTH} characters`,
      );
    }

    const trimmedUrl = url?.trim() || null;
    if (trimmedUrl && trimmedUrl.length > 500) {
      throw new ActionError("invalidInput", "URL must be 500 characters or less");
    }

    await rateLimit("issue:create");

    const { tenant, sessionId } = await getTenantFilter();

    await prisma.issueReport.create({
      data: {
        title: trimmedTitle,
        description: trimmedDesc,
        url: trimmedUrl,
        authorId: user.id,
        tenant,
        sessionId,
      },
    });

    await triggerGamification(user.id, "issue:create");

    revalidatePath("/issues");
  });
}

export const resolveIssue = guardedAction(
  "issue:resolve",
  "issue:resolve",
  async (session, issueId: string) => {
    validateUUID(issueId, "issue ID");
    const { tenant, sessionId } = await getTenantFilter();

    const issue = await prisma.issueReport.findFirst({
      where: { id: issueId, tenant, sessionId },
    });
    if (!issue) {
      throw new ActionError("notFound", "Issue not found");
    }

    const newResolvedAt = issue.resolvedAt ? null : new Date();
    await prisma.issueReport.update({
      where: { id: issueId },
      data: { resolvedAt: newResolvedAt },
    });

    await logAudit({
      action: newResolvedAt ? "issue.resolve" : "issue.unresolve",
      entityType: "IssueReport",
      entityId: issueId,
      actorId: session.user.id,
      actorName: session.user.alias ?? session.user.name,
      details: { title: issue.title },
    });

    revalidatePath("/issues");
  },
);
