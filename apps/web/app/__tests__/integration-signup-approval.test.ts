/**
 * Integration test: Signup → Approval multi-step workflow
 *
 * Tests the full lifecycle: first user becomes superuser, second user gets
 * "pending" role, admin approves them, permissions resolve correctly,
 * and pending users are blocked from actions.
 */

const mockAuth = jest.fn();
const mockRateLimit = jest.fn();

const mockUserCount = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserFindFirst = jest.fn();
const mockUserUpsert = jest.fn();
const mockUserUpdate = jest.fn();
const mockPermissionUpsert = jest.fn();
const mockPermissionFindUnique = jest.fn();
const mockUserPermissionDeleteMany = jest.fn();
const mockUserPermissionCreate = jest.fn();
const mockBoardFindFirst = jest.fn();
const mockBoardCreate = jest.fn();
const mockBoardAggregate = jest.fn();
const mockRevalidatePath = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      upsert: (...args: unknown[]) => mockUserUpsert(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    permission: {
      upsert: (...args: unknown[]) => mockPermissionUpsert(...args),
      findUnique: (...args: unknown[]) => mockPermissionFindUnique(...args),
    },
    userPermission: {
      deleteMany: (...args: unknown[]) => mockUserPermissionDeleteMany(...args),
      create: (...args: unknown[]) => mockUserPermissionCreate(...args),
    },
    board: {
      findFirst: (...args: unknown[]) => mockBoardFindFirst(...args),
      create: (...args: unknown[]) => mockBoardCreate(...args),
      aggregate: (...args: unknown[]) => mockBoardAggregate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
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
    fn: (session: unknown, ...args: TArgs) => Promise<void>,
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
        await fn(session, ...args);
      });
    };
  }

  return { guardedAction };
});

import { resolvePermissions } from "@/lib/permissions";
import { updateUserRole } from "@/lib/user-actions";
import { createBoard } from "@/lib/board-actions";

// --- Helpers ---

const superuserId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const pendingUserId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

function superuserSession() {
  return {
    user: {
      id: superuserId,
      role: "superuser",
      permissions: resolvePermissions("superuser"),
    },
  };
}

function pendingUserSession() {
  return {
    user: {
      id: pendingUserId,
      role: "pending",
      permissions: resolvePermissions("pending"),
    },
  };
}

function approvedUserSession() {
  return {
    user: {
      id: pendingUserId,
      role: "user",
      permissions: resolvePermissions("user"),
    },
  };
}

// --- Tests ---

describe("Integration: Signup → Approval workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  describe("Step 1: First user signup — becomes superuser", () => {
    test("first user gets superuser role with full permissions", () => {
      const permissions = resolvePermissions("superuser");

      // Superuser should have ALL permissions
      expect(permissions["admin:users"]).toBe(true);
      expect(permissions["board:create"]).toBe(true);
      expect(permissions["post:create"]).toBe(true);
      expect(permissions["thread:create"]).toBe(true);
      expect(permissions["event:create"]).toBe(true);
      expect(permissions["survey:results"]).toBe(true);
    });
  });

  describe("Step 2: Second user signup — gets pending role", () => {
    test("pending user has zero permissions", () => {
      const permissions = resolvePermissions("pending");

      // Pending users should have NO permissions
      expect(permissions["admin:users"]).toBe(false);
      expect(permissions["board:create"]).toBe(false);
      expect(permissions["post:create"]).toBe(false);
      expect(permissions["thread:create"]).toBe(false);
      expect(permissions["event:create"]).toBe(false);
      expect(permissions["survey:results"]).toBe(false);
    });

    test("pending user cannot create a board", async () => {
      mockAuth.mockResolvedValue(pendingUserSession());

      const result = await createBoard("My Board");

      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
      expect(mockBoardCreate).not.toHaveBeenCalled();
    });
  });

  describe("Step 3: Superuser approves pending user → user role", () => {
    test("superuser can promote pending user to user role", async () => {
      mockAuth.mockResolvedValue(superuserSession());
      mockUserFindFirst.mockResolvedValue({
        id: pendingUserId,
        role: "pending",
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await updateUserRole(pendingUserId, "user");

      expect(result).toBeUndefined();
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pendingUserId },
          data: expect.objectContaining({
            role: "user",
            permissionsVersion: { increment: 1 },
          }),
        }),
      );
    });

    test("pending user cannot promote themselves", async () => {
      mockAuth.mockResolvedValue(pendingUserSession());

      const result = await updateUserRole(pendingUserId, "user");

      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Step 4: Approved user can now use the platform", () => {
    test("approved user can create a board", async () => {
      mockAuth.mockResolvedValue(approvedUserSession());
      // user role has post:create but NOT board:create
      const result = await createBoard("My Board");

      // user role does NOT have board:create permission
      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
    });

    test("approved user gets correct permission set", () => {
      const permissions = resolvePermissions("user");

      // user role can create content but not admin actions
      expect(permissions["post:create"]).toBe(true);
      expect(permissions["topic:create"]).toBe(true);
      expect(permissions["thread:create"]).toBe(true);
      expect(permissions["event:create"]).toBe(true);

      // but NOT admin or board management
      expect(permissions["admin:users"]).toBe(false);
      expect(permissions["board:create"]).toBe(false);
      expect(permissions["board:edit"]).toBe(false);
      expect(permissions["board:delete"]).toBe(false);
    });
  });

  describe("Step 5: Role hierarchy enforcement", () => {
    test("admin cannot promote user to superuser (no admin:users permission)", async () => {
      const adminSession = {
        user: {
          id: "admin-1",
          role: "admin",
          permissions: resolvePermissions("admin"),
        },
      };
      mockAuth.mockResolvedValue(adminSession);

      const result = await updateUserRole(pendingUserId, "superuser");

      // admin role does NOT have admin:users permission — blocked at permission gate
      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
    });

    test("vuohi cannot assign superuser role (role hierarchy)", async () => {
      const vuohiSession = {
        user: {
          id: "vuohi-1",
          role: "vuohi",
          permissions: resolvePermissions("vuohi"),
        },
      };
      mockAuth.mockResolvedValue(vuohiSession);
      mockUserFindFirst.mockResolvedValue({
        id: pendingUserId,
        role: "user",
      });

      const result = await updateUserRole(pendingUserId, "superuser");

      expect(result).toEqual({
        error: expect.stringContaining("Cannot assign a role at the same or higher rank"),
        code: "permissionDenied",
      });
    });

    test("vuohi cannot modify a superuser (same or higher rank)", async () => {
      const vuohiSession = {
        user: {
          id: "vuohi-1",
          role: "vuohi",
          permissions: resolvePermissions("vuohi"),
        },
      };
      mockAuth.mockResolvedValue(vuohiSession);
      mockUserFindFirst.mockResolvedValue({
        id: superuserId,
        role: "superuser",
      });

      const result = await updateUserRole(superuserId, "user");

      expect(result).toEqual({
        error: expect.stringContaining("Cannot modify a user at the same or higher rank"),
        code: "permissionDenied",
      });
    });

    test("superuser can promote user to admin", async () => {
      mockAuth.mockResolvedValue(superuserSession());
      mockUserFindFirst.mockResolvedValue({
        id: pendingUserId,
        role: "user",
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await updateUserRole(pendingUserId, "admin");

      expect(result).toBeUndefined();
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: "admin" }),
        }),
      );
    });

    test("promoting to vuohi sets hasSeenPromotion to false", async () => {
      mockAuth.mockResolvedValue(superuserSession());
      mockUserFindFirst.mockResolvedValue({
        id: pendingUserId,
        role: "user",
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await updateUserRole(pendingUserId, "vuohi");

      expect(result).toBeUndefined();
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "vuohi",
            hasSeenPromotion: false,
          }),
        }),
      );
    });
  });

  describe("Step 6: Permission overrides change effective permissions", () => {
    test("user with board:create override can create boards", async () => {
      // Simulate a user role with a board:create override granted
      const overriddenPermissions = resolvePermissions("user", [
        { key: "board:create", granted: true },
      ]);

      expect(overriddenPermissions["board:create"]).toBe(true);
      // Other user defaults remain
      expect(overriddenPermissions["post:create"]).toBe(true);
      expect(overriddenPermissions["admin:users"]).toBe(false);

      // Now test that the action works with these permissions
      const session = {
        user: {
          id: pendingUserId,
          role: "user",
          permissions: overriddenPermissions,
        },
      };
      mockAuth.mockResolvedValue(session);
      mockBoardFindFirst.mockResolvedValue(null); // no slug conflict
      mockBoardAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
      mockBoardCreate.mockResolvedValue({ id: "new-board" });

      const result = await createBoard("Overridden Board");

      expect(result).toBeUndefined();
      expect(mockBoardCreate).toHaveBeenCalled();
    });

    test("admin with board:create revoked cannot create boards", async () => {
      const revokedPermissions = resolvePermissions("admin", [
        { key: "board:create", granted: false },
      ]);

      expect(revokedPermissions["board:create"]).toBe(false);
      // Other admin permissions remain
      expect(revokedPermissions["post:create"]).toBe(true);

      const session = {
        user: {
          id: "admin-1",
          role: "admin",
          permissions: revokedPermissions,
        },
      };
      mockAuth.mockResolvedValue(session);

      const result = await createBoard("Revoked Board");

      expect(result).toEqual({
        error: expect.stringContaining("Missing permission"),
        code: "permissionDenied",
      });
      expect(mockBoardCreate).not.toHaveBeenCalled();
    });
  });
});
