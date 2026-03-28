const mockAuth = jest.fn();
const mockRateLimit = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockPermissionUpsert = jest.fn();
const mockPermissionFindUnique = jest.fn();
const mockUserPermissionDeleteMany = jest.fn();
const mockUserPermissionCreate = jest.fn();
const mockUserPermissionFindMany = jest.fn();

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
    permission: {
      upsert: (...args: unknown[]) => mockPermissionUpsert(...args),
      findUnique: (...args: unknown[]) => mockPermissionFindUnique(...args),
    },
    userPermission: {
      deleteMany: (...args: unknown[]) => mockUserPermissionDeleteMany(...args),
      create: (...args: unknown[]) => mockUserPermissionCreate(...args),
      findMany: (...args: unknown[]) => mockUserPermissionFindMany(...args),
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

import { updateUserRole, updateUserPermissions } from "@/lib/user-actions";

function superuserSession() {
  return {
    user: {
      id: "superuser-1",
      role: "superuser",
      permissions: { "admin:users": true },
    },
  };
}

function vuohiSession() {
  return {
    user: {
      id: "vuohi-1",
      role: "vuohi",
      permissions: { "admin:users": true },
    },
  };
}

function adminSession() {
  return {
    user: {
      id: "admin-1",
      role: "admin",
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

  test("sets hasSeenPromotion to false when promoting from pending to vuohi", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockFindFirst.mockResolvedValue({ id: "user-1", role: "pending" });
    await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "vuohi");
    const updateArgs = mockUpdate.mock.calls[0][0];
    expect(updateArgs.data.hasSeenPromotion).toBe(false);
  });

  test("does not set hasSeenPromotion when promoting to non-vuohi role", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue({ id: "user-1", role: "pending" });
    await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    const updateArgs = mockUpdate.mock.calls[0][0];
    expect(updateArgs.data.hasSeenPromotion).toBeUndefined();
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

  // --- Role hierarchy enforcement (superuser > vuohi > admin > user > pending) ---

  test("vuohi cannot modify another vuohi member", async () => {
    mockAuth.mockResolvedValue(vuohiSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "vuohi" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toEqual({
      error: "Cannot modify a user at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("vuohi cannot modify a superuser", async () => {
    mockAuth.mockResolvedValue(vuohiSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "superuser" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toEqual({
      error: "Cannot modify a user at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("vuohi cannot promote a user to vuohi", async () => {
    mockAuth.mockResolvedValue(vuohiSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "user" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "vuohi");
    expect(result).toEqual({
      error: "Cannot assign a role at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("vuohi cannot promote a user to superuser", async () => {
    mockAuth.mockResolvedValue(vuohiSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "user" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "superuser");
    expect(result).toEqual({
      error: "Cannot assign a role at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("vuohi can change a lower-ranked user's role", async () => {
    mockAuth.mockResolvedValue(vuohiSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "user" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "admin");
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("admin cannot modify another admin", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "admin" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toEqual({
      error: "Cannot modify a user at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("admin cannot modify a vuohi member", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "vuohi" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toEqual({
      error: "Cannot modify a user at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("admin cannot promote a user to admin", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "pending" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "admin");
    expect(result).toEqual({
      error: "Cannot assign a role at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("superuser can modify a vuohi member", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "vuohi" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "user");
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("superuser can promote a user to vuohi", async () => {
    mockAuth.mockResolvedValue(superuserSession());
    mockFindFirst.mockResolvedValue({ id: "user-2", role: "user" });
    const result = await updateUserRole("550e8400-e29b-41d4-a716-446655440000", "vuohi");
    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});

const userId = "550e8400-e29b-41d4-a716-446655440000";

describe("updateUserPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue({ id: userId, role: "user" });
    mockPermissionUpsert.mockResolvedValue({});
    mockPermissionFindUnique.mockResolvedValue({ id: "perm-1", key: "post:create" });
    mockUserPermissionDeleteMany.mockResolvedValue({ count: 0 });
    mockUserPermissionCreate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
  });

  test("updates permissions for a lower-ranked user", async () => {
    mockAuth.mockResolvedValue(adminSession());
    const result = await updateUserPermissions(userId, [{ key: "post:create", granted: true }]);
    expect(result).toBeUndefined();
    expect(mockUserPermissionDeleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(mockUserPermissionCreate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { permissionsVersion: { increment: 1 } },
      }),
    );
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateUserPermissions(userId, []);
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
  });

  test("returns error without admin:users permission", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "u1", role: "admin", permissions: { "admin:users": false } },
    });
    const result = await updateUserPermissions(userId, []);
    expect(result).toEqual({
      error: "Missing permission: admin:users",
      code: "permissionDenied",
    });
  });

  test("returns error for invalid UUID", async () => {
    mockAuth.mockResolvedValue(adminSession());
    const result = await updateUserPermissions("bad-id", []);
    expect(result).toEqual({
      error: "Invalid user ID: not a valid UUID",
      code: "invalidId",
    });
  });

  test("returns error when target user not found", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue(null);
    const result = await updateUserPermissions(userId, []);
    expect(result).toEqual({ error: "User not found", code: "notFound" });
  });

  test("enforces role hierarchy — admin cannot modify another admin", async () => {
    mockAuth.mockResolvedValue(adminSession());
    mockFindFirst.mockResolvedValue({ id: userId, role: "admin" });
    const result = await updateUserPermissions(userId, []);
    expect(result).toEqual({
      error: "Cannot modify a user at the same or higher rank",
      code: "permissionDenied",
    });
    expect(mockUserPermissionDeleteMany).not.toHaveBeenCalled();
  });

  test("enforces role hierarchy — vuohi cannot modify superuser", async () => {
    mockAuth.mockResolvedValue(vuohiSession());
    mockFindFirst.mockResolvedValue({ id: userId, role: "superuser" });
    const result = await updateUserPermissions(userId, []);
    expect(result).toEqual({
      error: "Cannot modify a user at the same or higher rank",
      code: "permissionDenied",
    });
  });

  test("skips invalid permission keys", async () => {
    mockAuth.mockResolvedValue(adminSession());
    const result = await updateUserPermissions(userId, [
      { key: "nonexistent:permission", granted: true },
    ]);
    expect(result).toBeUndefined();
    expect(mockUserPermissionCreate).not.toHaveBeenCalled();
  });

  test("upserts all permission keys to Permission table", async () => {
    mockAuth.mockResolvedValue(adminSession());
    await updateUserPermissions(userId, []);
    expect(mockPermissionUpsert).toHaveBeenCalled();
  });

  test("bumps permissionsVersion after update", async () => {
    mockAuth.mockResolvedValue(adminSession());
    await updateUserPermissions(userId, [{ key: "post:create", granted: false }]);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { permissionsVersion: { increment: 1 } },
    });
  });
});
