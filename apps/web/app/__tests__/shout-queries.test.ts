const mockFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    shout: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "vuohiliitto", sessionId: null }),
  getActiveTenant: jest.fn().mockResolvedValue("vuohiliitto"),
}));

import { getRecentShouts } from "@/lib/shout-queries";

describe("getRecentShouts", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns shouts in chronological order with alias", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "s2",
        message: "Second",
        createdAt: new Date("2026-03-27T10:01:00Z"),
        author: { alias: "Bob", name: "Robert" },
      },
      {
        id: "s1",
        message: "First",
        createdAt: new Date("2026-03-27T10:00:00Z"),
        author: { alias: "Alice", name: "Alice Real" },
      },
    ]);

    const shouts = await getRecentShouts();
    expect(shouts).toHaveLength(2);
    // reversed from desc to chronological
    expect(shouts[0].alias).toBe("Alice");
    expect(shouts[0].message).toBe("First");
    expect(shouts[1].alias).toBe("Bob");
    expect(shouts[1].message).toBe("Second");
  });

  test("falls back to name when no alias", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "s1",
        message: "Hi",
        createdAt: new Date(),
        author: { alias: null, name: "Real Name" },
      },
    ]);

    const shouts = await getRecentShouts();
    expect(shouts[0].alias).toBe("Real Name");
  });

  test("uses Unknown when no alias or name", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "s1",
        message: "Hi",
        createdAt: new Date(),
        author: { alias: null, name: null },
      },
    ]);

    const shouts = await getRecentShouts();
    expect(shouts[0].alias).toBe("Unknown");
  });

  test("returns empty array when no shouts", async () => {
    mockFindMany.mockResolvedValue([]);
    const shouts = await getRecentShouts();
    expect(shouts).toEqual([]);
  });

  test("fetches with desc order and limit 50", async () => {
    mockFindMany.mockResolvedValue([]);
    await getRecentShouts();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    );
  });
});
