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

function setupMockData() {
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
  // First call: system quests (from Promise.all)
  mockQuestFindMany.mockResolvedValueOnce([
    {
      name: "Daily Post",
      icon: "pen",
      type: "daily",
      description: "Create a post",
      xpReward: 15,
      _count: { userProgress: 4 },
    },
  ]);
  // Second call: assigned/campaign quests
  mockQuestFindMany.mockResolvedValueOnce([
    {
      id: "cq1",
      name: "Review docs",
      xpReward: 100,
      status: "completed",
      priority: "high",
      assignee: { alias: "Bob", name: "Bob B" },
    },
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
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getGamificationStats", () => {
  test("returns correct summary stats", async () => {
    setupMockData();
    const stats = await getGamificationStats();
    expect(stats.summary).toEqual({
      totalUsersWithXp: 10,
      totalXpAwarded: 5000,
      averageXp: 500,
      highestXp: 2000,
    });
  });

  test("maps level distribution correctly", async () => {
    setupMockData();
    const stats = await getGamificationStats();
    expect(stats.levelDistribution).toHaveLength(10);
    expect(stats.levelDistribution[0]).toEqual({ level: 1, title: "Newcomer", count: 5 });
    expect(stats.levelDistribution[1]).toEqual({ level: 2, title: "Member", count: 3 });
  });

  test("resolves top achievements with counts", async () => {
    setupMockData();
    const stats = await getGamificationStats();
    expect(stats.topAchievements).toHaveLength(1);
    expect(stats.topAchievements[0].count).toBe(8);
  });

  test("calculates quest completion rates", async () => {
    setupMockData();
    const stats = await getGamificationStats();
    expect(stats.questCompletionRates).toHaveLength(2);
    expect(stats.questCompletionRates[0].completionRate).toBe(40);
    expect(stats.questCompletionRates[1].type).toBe("assigned");
    expect(stats.questCompletionRates[1].completionRate).toBe(100);
  });

  test("includes custom quest stats", async () => {
    setupMockData();
    const stats = await getGamificationStats();
    expect(stats.customQuestStats.total).toBe(1);
    expect(stats.customQuestStats.completed).toBe(1);
    expect(stats.customQuestStats.quests[0].assignee).toBe("Bob");
  });

  test("maps recent activity with user names", async () => {
    setupMockData();
    const stats = await getGamificationStats();
    expect(stats.recentActivity).toHaveLength(1);
    expect(stats.recentActivity[0].user).toBe("Alice");
  });

  test("returns empty fallback when DB throws", async () => {
    mockUserLevelCount.mockRejectedValue(new Error("relation does not exist"));
    const stats = await getGamificationStats();
    expect(stats.summary.totalUsersWithXp).toBe(0);
    expect(stats.levelDistribution).toHaveLength(10);
    expect(stats.topAchievements).toHaveLength(0);
    expect(stats.questCompletionRates).toHaveLength(0);
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
    expect(stats.customQuestStats.total).toBe(0);
    expect(stats.recentActivity).toHaveLength(0);
  });
});
