const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({ get: () => null }),
}));

jest.mock("@/lib/guardedAction", () => {
  const { ActionError } = jest.requireActual("@/lib/actionErrors");
  const { safe } = jest.requireActual("@/lib/actionUtils");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { rateLimit } = require("@/lib/rateLimit");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { auth } = require("@/auth");

  function guardedAction<TArgs extends unknown[]>(
    permission: string,
    rateLimitKey: string,
    fn: (...args: TArgs) => Promise<void>,
  ) {
    return async (...args: TArgs) => {
      return safe(async () => {
        const session = await auth();
        if (!session?.user) {
          throw new ActionError("permissionDenied", "Not authenticated");
        }
        const permissions = session.user.permissions as Record<string, boolean> | undefined;
        if (!permissions?.[permission]) {
          throw new ActionError("permissionDenied", `Missing permission: ${permission}`);
        }
        await rateLimit(rateLimitKey);
        await fn(...args);
      });
    };
  }

  return { guardedAction };
});

import { updateUserRole } from "@/lib/user-actions";

function adminSession() {
  return {
    user: {
      id: "admin-1",
      permissions: { "admin:users": true },
    },
  };
}

describe("updateUserRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue({ id: "user-1", role: "pending" });
    mockUpdate.mockResolvedValue({ id: "user-1" });
  });

  test("updates user role when admin has permission", async () => {
    mockAuth.mockResolvedValue(adminSession());
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = mockUpdate.mock.calls[0][0];
    expect(updateArgs.data.role).toBe("user");
    expect(updateArgs.data.permissionsVersion).toEqual({ increment: 1 });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("returns error when lacking admin:users permission", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "u1", permissions: { "admin:users": false } },
    });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toEqual({
      error: "Missing permission: admin:users",
      code: "permissionDenied",
    });
  });

  test("returns error for invalid role", async () => {
    mockAuth.mockResolvedValue(adminSession());
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "invalid");
    expect(result).toEqual({ error: "Invalid role: invalid", code: "invalidId" });
  });

  test("returns error for invalid UUID", async () => {
    mockAuth.mockResolvedValue(adminSession());
    const result = await updateUserRole("bad-id", "user");
    expect(result).toEqual({ error: "Invalid user ID: not a valid UUID", code: "invalidId" });
  });

  test("returns error when user not found", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue(null);
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "admin");
    expect(result).toEqual({ error: "User not found", code: "notFound" });
  });
});
