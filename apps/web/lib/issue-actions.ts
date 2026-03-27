"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ActionError } from "@/lib/actionErrors";
import { safe, type ActionResult } from "@/lib/actionUtils";
import { rateLimit } from "@/lib/rateLimit";

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

    if (!trimmedTitle || trimmedTitle.length > 200) {
      throw new ActionError("invalidInput", "Title must be 1-200 characters");
    }

    if (!trimmedDesc || trimmedDesc.length > 2000) {
      throw new ActionError("invalidInput", "Description must be 1-2000 characters");
    }

    await rateLimit("issue:create");

    await prisma.issueReport.create({
      data: {
        title: trimmedTitle,
        description: trimmedDesc,
        url: url?.trim() || null,
        authorId: session.user.id,
      },
    });
  });
}
