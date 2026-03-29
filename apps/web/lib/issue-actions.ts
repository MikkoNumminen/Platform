"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, validateUUID, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import { guardedAction } from "@/lib/guardedAction";
import { triggerGamification } from "@/lib/gamification/trigger";
import { getDemoSessionId } from "@/lib/demo-session";

const MAX_ISSUE_TITLE_LENGTH = 200;
const MAX_ISSUE_DESCRIPTION_LENGTH = 2000;

export async function createIssueReport(
  title: string,
  description: string,
  url?: string,
): Promise<ActionResult> {
  return safe(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ActionError("permissionDenied", "Not authenticated");
    }

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

    await rateLimit("issue:create");

    const sessionId = await getDemoSessionId();

    await prisma.issueReport.create({
      data: {
        title: trimmedTitle,
        description: trimmedDesc,
        url: url?.trim() || null,
        authorId: session.user.id,
        sessionId,
      },
    });

    await triggerGamification(session.user.id, "issue:create");

    revalidatePath("/issues");
  });
}

export const resolveIssue = guardedAction(
  "issue:resolve",
  "issue:resolve",
  async (_session, issueId: string) => {
    validateUUID(issueId, "issue ID");
    const sessionId = await getDemoSessionId();

    const issue = await prisma.issueReport.findFirst({
      where: { id: issueId, sessionId },
    });
    if (!issue) {
      throw new ActionError("notFound", "Issue not found");
    }

    await prisma.issueReport.update({
      where: { id: issueId },
      data: { resolvedAt: issue.resolvedAt ? null : new Date() },
    });

    revalidatePath("/issues");
  },
);
