const mockAuth = jest.fn();
const mockCreate = jest.fn();
const mockRateLimit = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    shout: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

jest.mock("@/lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "vuohiliitto", sessionId: null }),
  getActiveTenant: jest.fn().mockResolvedValue("vuohiliitto"),
}));

import { createShout } from "@/lib/shout-actions";

function authenticatedSession(id = "user-1") {
  return { user: { id } };
}

describe("createShout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({ id: "shout-1" });
  });

  test("creates shout for authenticated user", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createShout("Hello world!");
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledWith({
      data: { message: "Hello world!", authorId: "user-1", tenant: "vuohiliitto", sessionId: null },
    });
  });

  test("trims whitespace", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    await createShout("  trimmed  ");
    expect(mockCreate).toHaveBeenCalledWith({
      data: { message: "trimmed", authorId: "user-1", tenant: "vuohiliitto", sessionId: null },
    });
  });

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createShout("Hello");
    expect(result).toEqual({ error: "Not authenticated", code: "permissionDenied" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("returns error for empty message", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createShout("   ");
    expect(result).toEqual({ error: "Message must be 1-280 characters", code: "invalidInput" });
  });

  test("returns error for message too long", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    const result = await createShout("a".repeat(281));
    expect(result).toEqual({ error: "Message must be 1-280 characters", code: "invalidInput" });
  });

  test("calls rate limit", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    await createShout("Hello");
    expect(mockRateLimit).toHaveBeenCalledWith("shout:create");
  });
});
