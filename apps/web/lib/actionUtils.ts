import { ActionError, RateLimitError } from "./actionErrors";
import { logger } from "./logger";

export type ActionResult = { error: string; code: string } | undefined;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(value: string, fieldName: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new ActionError("invalidId", `Invalid ${fieldName}: not a valid UUID`);
  }
}

export async function safe(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    // Re-throw Next.js internal errors (redirect, notFound)
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.message === "NEXT_NOT_FOUND")
    ) {
      throw error;
    }

    // Handle redirect/notFound from next/navigation (digest-based detection)
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }

    if (error instanceof ActionError) {
      return { error: error.message, code: error.code };
    }

    if (error instanceof RateLimitError) {
      return { error: error.message, code: "rateLimited" };
    }

    // Unknown error — log but don't expose details
    logger.error("Unexpected action error", error, "actions");
    return { error: "An unexpected error occurred", code: "unexpectedError" };
  }
}
