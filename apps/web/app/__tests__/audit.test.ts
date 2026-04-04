const mockAuth = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    auditLog: {
      create: (...a: unknown[]) => mockAuditLogCreate(...a),
    },
  },
}));

jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "platform", sessionId: null }),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { logAudit } from "@/lib/audit";
import { diffValues } from "@/lib/audit-utils";
import { logger } from "@/lib/logger";

describe("logAudit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditLogCreate.mockResolvedValue({ id: "log-1" });
  });

  test("writes an audit log entry with correct fields", async () => {
    await logAudit({
      action: "user.updateRole",
      entityType: "User",
      entityId: "user-123",
      actorId: "admin-1",
      actorName: "Admin",
      details: { oldValues: { role: "user" }, newValues: { role: "admin" } },
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        action: "user.updateRole",
        entityType: "User",
        entityId: "user-123",
        actorId: "admin-1",
        actorName: "Admin",
        details: { oldValues: { role: "user" }, newValues: { role: "admin" } },
        tenant: "platform",
        sessionId: null,
      },
    });
  });

  test("handles null entityId and actorName", async () => {
    await logAudit({
      action: "achievement.create",
      entityType: "Achievement",
      actorId: "admin-1",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityId: null,
        actorName: null,
      }),
    });
  });

  test("does not throw when DB write fails", async () => {
    mockAuditLogCreate.mockRejectedValue(new Error("DB error"));

    await expect(
      logAudit({
        action: "test.action",
        entityType: "Test",
        actorId: "user-1",
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to write audit log",
      expect.any(Error),
      "audit",
    );
  });
});

describe("diffValues", () => {
  test("returns null when objects are identical", () => {
    const result = diffValues({ role: "admin" }, { role: "admin" });
    expect(result).toBeNull();
  });

  test("returns correct old/new for changed fields", () => {
    const result = diffValues({ role: "user", name: "Alice" }, { role: "admin", name: "Alice" });
    expect(result).toEqual({
      oldValues: { role: "user" },
      newValues: { role: "admin" },
    });
  });

  test("handles new fields not present in old object", () => {
    const result = diffValues({}, { tag: "master" });
    expect(result).toEqual({
      oldValues: { tag: undefined },
      newValues: { tag: "master" },
    });
  });

  test("handles multiple changed fields", () => {
    const result = diffValues({ role: "user", tag: null }, { role: "admin", tag: "coder" });
    expect(result).toEqual({
      oldValues: { role: "user", tag: null },
      newValues: { role: "admin", tag: "coder" },
    });
  });
});
