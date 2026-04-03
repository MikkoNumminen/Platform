import { ActionError, RateLimitError, type ErrorCode } from "./actionErrors";
import { logger } from "./logger";

export type ActionResult = { error: string; code: string } | undefined;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(value: string, fieldName: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new ActionError("invalidId", `Invalid ${fieldName}: not a valid UUID`);
  }
}

/**
 * Creates a string validator that trims, checks for empty, and enforces max length.
 */
export function createStringValidator(
  fieldName: string,
  maxLength: number,
  emptyCode: ErrorCode,
  tooLongCode: ErrorCode,
): (value: string) => string {
  return (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ActionError(emptyCode, `${fieldName} is required`);
    }
    if (trimmed.length > maxLength) {
      throw new ActionError(tooLongCode, `${fieldName} must be ${maxLength} characters or less`);
    }
    return trimmed;
  };
}

/**
 * Returns the authenticated user or throws ActionError.
 * Use inside safe() blocks in server actions.
 */
export async function requireUser() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    throw new ActionError("permissionDenied", "Not authenticated");
  }
  return session.user as typeof session.user & { id: string };
}

/**
 * Returns the authenticated user if they have an admin-level role,
 * or throws ActionError. Accepts superuser, vuohi, and admin.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const role = user.role;
  if (role !== "superuser" && role !== "vuohi" && role !== "admin") {
    throw new ActionError("permissionDenied", "Admin access required");
  }
  return user;
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
