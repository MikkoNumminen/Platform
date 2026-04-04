const mockAuth = jest.fn();
const mockXpFindMany = jest.fn();
const mockUserLevelFindUnique = jest.fn();
const mockUserLevelFindFirst = jest.fn();
const mockLoginStreakFindUnique = jest.fn();
const mockUserAchievementFindMany = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "vuohiliitto", sessionId: null }),
  getActiveTenant: jest.fn().mockResolvedValue("vuohiliitto"),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    xpTransaction: { findMany: (...a: unknown[]) => mockXpFindMany(...a) },
    userLevel: {
      findUnique: (...a: unknown[]) => mockUserLevelFindUnique(...a),
      findFirst: (...a: unknown[]) => mockUserLevelFindFirst(...a),
    },
    loginStreak: { findUnique: (...a: unknown[]) => mockLoginStreakFindUnique(...a) },
    userAchievement: { findMany: (...a: unknown[]) => mockUserAchievementFindMany(...a) },
  },
}));

import { getLatestXpGains, getMyGamificationProfile } from "@/lib/gamification/xp-actions";

function authenticatedSession() {
  return { user: { id: "user-1" } };
}

describe("getLatestXpGains", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns gains and level for authenticated user", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockXpFindMany.mockResolvedValue([
      { amount: 10, source: "post:create", createdAt: new Date() },
      { amount: 5, source: "shout:create", createdAt: new Date() },
    ]);
    mockUserLevelFindFirst.mockResolvedValue({ totalXp: 150, level: 2 });

    const since = new Date(Date.now() - 60000);
    const result = await getLatestXpGains(since);

    expect(result.gains).toHaveLength(2);
    expect(result.gains[0]).toEqual({ amount: 10, source: "post:create" });
    expect(result.totalXp).toBe(150);
    expect(result.level).toBeGreaterThanOrEqual(1);
  });

  test("returns defaults for unauthenticated user", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getLatestXpGains(new Date());
    expect(result).toEqual({ gains: [], level: 1, totalXp: 0 });
  });

  test("returns level 1 when no user level record", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockXpFindMany.mockResolvedValue([]);
    mockUserLevelFindFirst.mockResolvedValue(null);

    const result = await getLatestXpGains(new Date());
    expect(result.totalXp).toBe(0);
    expect(result.level).toBe(1);
  });

  test("queries transactions since provided date", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockXpFindMany.mockResolvedValue([]);
    mockUserLevelFindFirst.mockResolvedValue(null);

    const since = new Date("2026-03-01T00:00:00Z");
    await getLatestXpGains(since);

    expect(mockXpFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          createdAt: { gt: since },
        }),
      }),
    );
  });
});

describe("getMyGamificationProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns null for unauthenticated user", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getMyGamificationProfile();
    expect(result).toBeNull();
  });

  test("returns profile for authenticated user", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockUserLevelFindFirst.mockResolvedValue({ totalXp: 500, level: 5 });
    mockLoginStreakFindUnique.mockResolvedValue({ currentStreak: 3, longestStreak: 7 });
    mockUserAchievementFindMany.mockResolvedValue([
      {
        achievement: { name: "First Post", icon: "star", tier: "bronze" },
        unlockedAt: new Date("2026-03-15"),
      },
    ]);

    const result = await getMyGamificationProfile();
    expect(result).not.toBeNull();
    expect(result!.totalXp).toBe(500);
    expect(result!.level).toBe(5);
    expect(result!.currentStreak).toBe(3);
    expect(result!.longestStreak).toBe(7);
    expect(result!.recentAchievements).toHaveLength(1);
    expect(result!.recentAchievements[0].name).toBe("First Post");
  });

  test("returns defaults when no level or streak records exist", async () => {
    mockAuth.mockResolvedValue(authenticatedSession());
    mockUserLevelFindFirst.mockResolvedValue(null);
    mockLoginStreakFindUnique.mockResolvedValue(null);
    mockUserAchievementFindMany.mockResolvedValue([]);

    const result = await getMyGamificationProfile();
    expect(result!.totalXp).toBe(0);
    expect(result!.level).toBe(1);
    expect(result!.currentStreak).toBe(0);
    expect(result!.longestStreak).toBe(0);
    expect(result!.recentAchievements).toHaveLength(0);
  });
});
