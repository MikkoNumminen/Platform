import { RateLimitError } from "@/lib/actionErrors";

const mockAuth = jest.fn();
const mockHeaders = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

import { rateLimit } from "@/lib/rateLimit";

function makeHeaderMap(map: Record<string, string | null> = {}) {
  return {
    get: (key: string) => map[key] ?? null,
  };
}

describe("rateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue(makeHeaderMap());
    mockQueryRaw.mockResolvedValue([{ count: 1 }]);
  });

  test("allows request when under limit", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    await expect(rateLimit("create-board")).resolves.toBeUndefined();
  });

  test("allows request at exactly the limit (30)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQueryRaw.mockResolvedValue([{ count: 30 }]);

    await expect(rateLimit("create-board")).resolves.toBeUndefined();
  });

  test("throws RateLimitError when over limit", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQueryRaw.mockResolvedValue([{ count: 31 }]);

    await expect(rateLimit("create-board")).rejects.toThrow(RateLimitError);
    await expect(rateLimit("create-board")).rejects.toThrow("Rate limit exceeded for create-board");
  });

  test("uses user ID as identifier when authenticated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } });

    await rateLimit("test-action");

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  test("prefers x-vercel-forwarded-for header for IP", async () => {
    mockAuth.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(
      makeHeaderMap({
        "x-vercel-forwarded-for": "1.2.3.4, 5.6.7.8",
        "x-forwarded-for": "9.9.9.9",
      }),
    );

    await rateLimit("action");
    expect(mockQueryRaw).toHaveBeenCalled();
  });

  test("falls back to x-forwarded-for when no vercel header", async () => {
    mockAuth.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(
      makeHeaderMap({
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      }),
    );

    await rateLimit("action");
    expect(mockQueryRaw).toHaveBeenCalled();
  });

  test("falls back to x-real-ip when no forwarded headers", async () => {
    mockAuth.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(
      makeHeaderMap({
        "x-real-ip": "192.168.1.1",
      }),
    );

    await rateLimit("action");
    expect(mockQueryRaw).toHaveBeenCalled();
  });

  test("uses 'anonymous' when no headers and no session", async () => {
    mockAuth.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(makeHeaderMap());

    await rateLimit("action");
    expect(mockQueryRaw).toHaveBeenCalled();
  });

  test("handles empty query result gracefully", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQueryRaw.mockResolvedValue([]);

    // count defaults to 0, which is under limit
    await expect(rateLimit("action")).resolves.toBeUndefined();
  });

  test("respects custom maxRequests parameter", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQueryRaw.mockResolvedValue([{ count: 4 }]);

    // Limit of 3 means count=4 exceeds it
    await expect(rateLimit("gdpr:deleteAccount", 3)).rejects.toThrow(RateLimitError);
  });

  test("allows request at exactly the custom limit", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQueryRaw.mockResolvedValue([{ count: 10 }]);

    // count=10 is exactly at limit=10, should pass
    await expect(rateLimit("alias:set", 10)).resolves.toBeUndefined();
  });
});
