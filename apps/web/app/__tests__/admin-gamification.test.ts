/* eslint-disable @typescript-eslint/no-explicit-any */
const mockUserLevelCount = jest.fn();
const mockUserLevelAggregate = jest.fn();
const mockUserLevelGroupBy = jest.fn();
const mockUserAchievementGroupBy = jest.fn();
const mockQuestFindMany = jest.fn();
const mockXpTransactionFindMany = jest.fn();
const mockAchievementFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    userLevel: {
      count: (...a: any[]) => mockUserLevelCount(...a),
      aggregate: (...a: any[]) => mockUserLevelAggregate(...a),
      groupBy: (...a: any[]) => mockUserLevelGroupBy(...a),
    },
    userAchievement: {
      groupBy: (...a: any[]) => mockUserAchievementGroupBy(...a),
    },
    quest: {
      findMany: (...a: any[]) => mockQuestFindMany(...a),
    },
    xpTransaction: {
      findMany: (...a: any[]) => mockXpTransactionFindMany(...a),
    },
    achievement: {
      findMany: (...a: any[]) => mockAchievementFindMany(...a),
    },
  },
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));

import { getGamificationStats } from "@/lib/gamification/admin-queries";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getGamificationStats", () => {
  test("returns correct structure with data", async () => {
    mockUserLevelCount.mockResolvedValue(10);
    mockUserLevelAggregate.mockResolvedValue({
      _sum: { totalXp: 5000 },
      _avg: { totalXp: 500 },
      _max: { totalXp: 2000 },
    });
    mockUserLevelGroupBy.mockResolvedValue([
      { level: 1, _count: { level: 5 } },
      { level: 2, _count: { level: 3 } },
      { level: 3, _count: { level: 2 } },
    ]);
    mockUserAchievementGroupBy.mockResolvedValue([
      { achievementId: "a1", _count: { achievementId: 8 } },
    ]);
    mockQuestFindMany.mockResolvedValue([
      { name: "Daily Post", icon: "pen", type: "daily", _count: { userProgress: 4 } },
    ]);
    mockXpTransactionFindMany.mockResolvedValue([
      {
        user: { alias: "Alice", name: "Alice A" },
        amount: 20,
        source: "post:create",
        createdAt: new Date(),
      },
    ]);
    mockAchievementFindMany.mockResolvedValue([
      { id: "a1", name: "First Post", key: "first_post", icon: "star" },
    ]);

    const stats = await getGamificationStats();

    expect(stats.summary).toEqual({
      totalUsersWithXp: 10,
      totalXpAwarded: 5000,
      averageXp: 500,
      highestXp: 2000,
    });
    expect(stats.levelDistribution).toHaveLength(10);
    expect(stats.levelDistribution[0]).toEqual({ level: 1, title: "Newcomer", count: 5 });
    expect(stats.levelDistribution[1]).toEqual({ level: 2, title: "Member", count: 3 });
    expect(stats.topAchievements).toHaveLength(1);
    expect(stats.topAchievements[0].count).toBe(8);
    expect(stats.questCompletionRates).toHaveLength(1);
    expect(stats.questCompletionRates[0].completionRate).toBe(40);
    expect(stats.recentActivity).toHaveLength(1);
    expect(stats.recentActivity[0].user).toBe("Alice");
  });

  test("handles empty data", async () => {
    mockUserLevelCount.mockResolvedValue(0);
    mockUserLevelAggregate.mockResolvedValue({
      _sum: { totalXp: null },
      _avg: { totalXp: null },
      _max: { totalXp: null },
    });
    mockUserLevelGroupBy.mockResolvedValue([]);
    mockUserAchievementGroupBy.mockResolvedValue([]);
    mockQuestFindMany.mockResolvedValue([]);
    mockXpTransactionFindMany.mockResolvedValue([]);
    mockAchievementFindMany.mockResolvedValue([]);

    const stats = await getGamificationStats();

    expect(stats.summary).toEqual({
      totalUsersWithXp: 0,
      totalXpAwarded: 0,
      averageXp: 0,
      highestXp: 0,
    });
    expect(stats.levelDistribution).toHaveLength(10);
    expect(stats.levelDistribution.every((d) => d.count === 0)).toBe(true);
    expect(stats.topAchievements).toHaveLength(0);
    expect(stats.questCompletionRates).toHaveLength(0);
    expect(stats.recentActivity).toHaveLength(0);
  });
});
