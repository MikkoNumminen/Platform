/**
 * Shared guardedAction mock for tests.
 *
 * Usage in test files:
 * ```
 * jest.mock("@/lib/guardedAction", () => require("./helpers/mock-guarded-action"));
 * ```
 *
 * Requires that the test file has already mocked @/auth and @/lib/rateLimit.
 */

const { ActionError } = jest.requireActual("@/lib/actionErrors");
const { safe } = jest.requireActual("@/lib/actionUtils");

function guardedAction<TArgs extends unknown[]>(
  permission: string,
  rateLimitKey: string,
  fn: (session: unknown, ...args: TArgs) => Promise<void>,
) {
  return async (...args: TArgs) => {
    return safe(async () => {
      // Lazy require so we pick up the test file's mocks
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { auth } = require("@/auth");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { rateLimit } = require("@/lib/rateLimit");

      const session = await auth();
      if (!session?.user) {
        throw new ActionError("permissionDenied", "Not authenticated");
      }
      const permissions = session.user.permissions as Record<string, boolean> | undefined;
      if (!permissions?.[permission]) {
        throw new ActionError("permissionDenied", `Missing permission: ${permission}`);
      }
      await rateLimit(rateLimitKey);
      await fn(session, ...args);
    });
  };
}

module.exports = { guardedAction };
