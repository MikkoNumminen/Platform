/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Mock function declarations (hoisted by jest) ---
const mockXpTransactionAggregate = jest.fn();
const mockXpTransactionCreate = jest.fn();
const mockXpTransactionFindMany = jest.fn();
const mockUserLevelFindUnique = jest.fn();
const mockUserLevelFindMany = jest.fn();
const mockUserLevelUpsert = jest.fn();
const mockUserLevelUpdate = jest.fn();
const mockLoginStreakFindUnique = jest.fn();
const mockLoginStreakCreate = jest.fn();
const mockLoginStreakUpdate = jest.fn();
const mockAchievementFindMany = jest.fn();
const mockUserAchievementFindMany = jest.fn();
const mockUserAchievementCreate = jest.fn();
const mockQuestFindMany = jest.fn();
const mockUserQuestProgressFindUnique = jest.fn();
const mockUserQuestProgressUpsert = jest.fn();
const mockUserQuestProgressUpdateMany = jest.fn();
const mockPostCount = jest.fn();
const mockThreadCount = jest.fn();
const mockTopicCount = jest.fn();
const mockCalendarEventCount = jest.fn();
const mockShoutCount = jest.fn();
const mockIssueReportCount = jest.fn();
const mockSurveyResponseCount = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserTourProgressCount = jest.fn();
const mockFeedbackCount = jest.fn();
const mockUserQuestProgressFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    xpTransaction: {
      aggregate: (...a: any[]) => mockXpTransactionAggregate(...a),
      create: (...a: any[]) => mockXpTransactionCreate(...a),
      findMany: (...a: any[]) => mockXpTransactionFindMany(...a),
    },
    userLevel: {
      findUnique: (...a: any[]) => mockUserLevelFindUnique(...a),
      findMany: (...a: any[]) => mockUserLevelFindMany(...a),
      upsert: (...a: any[]) => mockUserLevelUpsert(...a),
      update: (...a: any[]) => mockUserLevelUpdate(...a),
    },
    loginStreak: {
      findUnique: (...a: any[]) => mockLoginStreakFindUnique(...a),
      create: (...a: any[]) => mockLoginStreakCreate(...a),
      update: (...a: any[]) => mockLoginStreakUpdate(...a),
    },
    achievement: { findMany: (...a: any[]) => mockAchievementFindMany(...a) },
    userAchievement: {
      findMany: (...a: any[]) => mockUserAchievementFindMany(...a),
      create: (...a: any[]) => mockUserAchievementCreate(...a),
    },
    quest: { findMany: (...a: any[]) => mockQuestFindMany(...a) },
    userQuestProgress: {
      findUnique: (...a: any[]) => mockUserQuestProgressFindUnique(...a),
      findMany: (...a: any[]) => mockUserQuestProgressFindMany(...a),
      upsert: (...a: any[]) => mockUserQuestProgressUpsert(...a),
      updateMany: (...a: any[]) => mockUserQuestProgressUpdateMany(...a),
    },
    post: { count: (...a: any[]) => mockPostCount(...a) },
    thread: { count: (...a: any[]) => mockThreadCount(...a) },
    topic: { count: (...a: any[]) => mockTopicCount(...a) },
    calendarEvent: { count: (...a: any[]) => mockCalendarEventCount(...a) },
    shout: { count: (...a: any[]) => mockShoutCount(...a) },
    issueReport: { count: (...a: any[]) => mockIssueReportCount(...a) },
    surveyResponse: { count: (...a: any[]) => mockSurveyResponseCount(...a) },
    user: { findUnique: (...a: any[]) => mockUserFindUnique(...a) },
    userTourProgress: { count: (...a: any[]) => mockUserTourProgressCount(...a) },
    feedback: { count: (...a: any[]) => mockFeedbackCount(...a) },
  },
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));

import {
  awardXp,
  awardCustomXp,
  getUserXpData,
  getLeaderboard,
  getRecentXpTransactions,
} from "@/lib/gamification/xp-service";
import {
  checkAchievements,
  getUserAchievements,
  getAllAchievementsWithStatus,
} from "@/lib/gamification/achievement-service";
import {
  updateQuestProgress,
  getActiveQuests,
  resetDailyQuests,
  resetWeeklyQuests,
} from "@/lib/gamification/quest-service";
import { recordLogin, getLoginStreak } from "@/lib/gamification/login-streak";
import { triggerGamification } from "@/lib/gamification/trigger";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("xp-service", () => {
  describe("awardXp", () => {
    test("returns null for zero-xp sources", async () => {
      const result = await awardXp("u1", "quest:complete");
      expect(result).toBeNull();
    });

    test("creates xp transaction and upserts user level", async () => {
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 15, level: 1, userId: "u1" });

      const result = await awardXp("u1", "issue:create", "issue-1");

      expect(mockXpTransactionCreate).toHaveBeenCalledWith({
        data: { userId: "u1", amount: 15, source: "issue:create", sourceId: "issue-1" },
      });
      expect(mockUserLevelUpsert).toHaveBeenCalled();
      expect(result).toEqual({
        xpAwarded: 15,
        totalXp: 15,
        level: 1,
        previousLevel: 1,
        leveledUp: false,
      });
    });

    test("detects level up", async () => {
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 100, level: 1, userId: "u1" });
      mockUserLevelUpdate.mockResolvedValue({});

      const result = await awardXp("u1", "issue:create");

      expect(result!.leveledUp).toBe(true);
      expect(result!.level).toBe(2);
      expect(result!.previousLevel).toBe(1);
      expect(mockUserLevelUpdate).toHaveBeenCalled();
    });

    test("enforces daily shout xp cap", async () => {
      mockXpTransactionAggregate.mockResolvedValue({ _sum: { amount: 25 } });

      const result = await awardXp("u1", "shout:create");
      expect(result).toBeNull();
      expect(mockXpTransactionCreate).not.toHaveBeenCalled();
    });

    test("allows shout xp below cap", async () => {
      mockXpTransactionAggregate.mockResolvedValue({ _sum: { amount: 20 } });
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 25, level: 1, userId: "u1" });

      const result = await awardXp("u1", "shout:create");
      expect(result).not.toBeNull();
      expect(result!.xpAwarded).toBe(5);
    });
  });

  describe("getUserXpData", () => {
    test("returns user xp data when user exists", async () => {
      mockUserLevelFindUnique.mockResolvedValue({ totalXp: 500, level: 3 });
      const data = await getUserXpData("u1");
      expect(data).toEqual({ totalXp: 500, level: 3 });
    });

    test("returns defaults when user has no xp data", async () => {
      mockUserLevelFindUnique.mockResolvedValue(null);
      const data = await getUserXpData("u1");
      expect(data).toEqual({ totalXp: 0, level: 1 });
    });
  });

  describe("getLeaderboard", () => {
    test("returns ranked leaderboard entries", async () => {
      mockUserLevelFindMany.mockResolvedValue([
        {
          userId: "u1",
          totalXp: 500,
          level: 3,
          user: {
            id: "u1",
            alias: "Alice",
            name: "Alice A",
            image: null,
            avatarUrl: "/a.png",
            role: "vuohi",
          },
        },
        {
          userId: "u2",
          totalXp: 200,
          level: 2,
          user: {
            id: "u2",
            alias: null,
            name: "Bob B",
            image: "/b.png",
            avatarUrl: null,
            role: "vuohi",
          },
        },
      ]);

      const lb = await getLeaderboard(10);
      expect(lb).toHaveLength(2);
      expect(lb[0].rank).toBe(1);
      expect(lb[0].alias).toBe("Alice");
      expect(lb[0].image).toBe("/a.png");
      expect(lb[1].rank).toBe(2);
      expect(lb[1].image).toBe("/b.png");
    });
  });
});

describe("achievement-service", () => {
  describe("checkAchievements", () => {
    test("unlocks achievement when threshold is met", async () => {
      mockAchievementFindMany.mockResolvedValue([
        {
          id: "a1",
          key: "first_shout",
          criteria: { type: "count", action: "shout:create", threshold: 1 },
          xpReward: 50,
        },
      ]);
      mockUserAchievementFindMany.mockResolvedValue([]);
      mockShoutCount.mockResolvedValue(1);
      mockUserAchievementCreate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({});

      const results = await checkAchievements("u1", "shout:create");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ achievementKey: "first_shout", unlocked: true, xpAwarded: 50 });
    });

    test("skips already unlocked achievements", async () => {
      mockAchievementFindMany.mockResolvedValue([
        {
          id: "a1",
          key: "first_shout",
          criteria: { type: "count", action: "shout:create", threshold: 1 },
          xpReward: 50,
        },
      ]);
      mockUserAchievementFindMany.mockResolvedValue([{ achievementId: "a1" }]);

      const results = await checkAchievements("u1", "shout:create");
      expect(results).toHaveLength(0);
    });

    test("skips achievements for different actions", async () => {
      mockAchievementFindMany.mockResolvedValue([
        {
          id: "a1",
          key: "first_shout",
          criteria: { type: "count", action: "shout:create", threshold: 1 },
          xpReward: 50,
        },
      ]);
      mockUserAchievementFindMany.mockResolvedValue([]);

      const results = await checkAchievements("u1", "issue:create");
      expect(results).toHaveLength(0);
    });

    test("unlocks tour:complete achievement when all steps are done", async () => {
      mockAchievementFindMany.mockResolvedValue([
        {
          id: "a-demo",
          key: "demo_explorer",
          criteria: { type: "count", action: "tour:complete", threshold: 1 },
          xpReward: 75,
        },
      ]);
      mockUserAchievementFindMany.mockResolvedValue([]);
      // User is "pending" role → 3 steps required
      mockUserFindUnique.mockResolvedValue({ role: "pending" });
      mockUserTourProgressCount.mockResolvedValue(3);
      mockUserAchievementCreate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({});

      const results = await checkAchievements("u1", "tour:complete");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        achievementKey: "demo_explorer",
        unlocked: true,
        xpAwarded: 75,
      });
    });

    test("does not unlock tour:complete when steps are incomplete", async () => {
      mockAchievementFindMany.mockResolvedValue([
        {
          id: "a-demo",
          key: "demo_explorer",
          criteria: { type: "count", action: "tour:complete", threshold: 1 },
          xpReward: 75,
        },
      ]);
      mockUserAchievementFindMany.mockResolvedValue([]);
      // User is "user" role → 8 steps required, only 5 done
      mockUserFindUnique.mockResolvedValue({ role: "user" });
      mockUserTourProgressCount.mockResolvedValue(5);

      const results = await checkAchievements("u1", "tour:complete");
      expect(results).toHaveLength(0);
    });

    test("handles zero xp reward achievement", async () => {
      mockAchievementFindMany.mockResolvedValue([
        {
          id: "a1",
          key: "first_shout_zero",
          criteria: { type: "count", action: "shout:create", threshold: 1 },
          xpReward: 0,
        },
      ]);
      mockUserAchievementFindMany.mockResolvedValue([]);
      mockShoutCount.mockResolvedValue(1);
      mockUserAchievementCreate.mockResolvedValue({});

      const results = await checkAchievements("u1", "shout:create");
      expect(results[0].xpAwarded).toBe(0);
      expect(mockXpTransactionCreate).not.toHaveBeenCalled();
    });
  });
});

describe("quest-service", () => {
  describe("updateQuestProgress", () => {
    test("increments progress for matching quest", async () => {
      mockQuestFindMany.mockResolvedValue([
        {
          id: "q1",
          key: "daily_post",
          criteria: { action: "post:create", count: 3 },
          repeatable: false,
          xpReward: 30,
        },
      ]);
      mockUserQuestProgressFindMany.mockResolvedValue([]);
      mockUserQuestProgressUpsert.mockResolvedValue({});

      const results = await updateQuestProgress("u1", "post:create");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        questKey: "daily_post",
        completed: false,
        progress: 1,
        target: 3,
      });
    });

    test("completes quest when target is reached", async () => {
      mockQuestFindMany.mockResolvedValue([
        {
          id: "q1",
          key: "daily_post",
          criteria: { action: "post:create", count: 2 },
          repeatable: false,
          xpReward: 30,
        },
      ]);
      mockUserQuestProgressFindMany.mockResolvedValue([
        { questId: "q1", progress: 1, completed: false, resetAt: null, completedAt: null },
      ]);
      mockUserQuestProgressUpsert.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({});

      const results = await updateQuestProgress("u1", "post:create");
      expect(results[0].completed).toBe(true);
      expect(results[0].xpAwarded).toBe(30);
    });

    test("skips completed non-repeatable quests", async () => {
      mockQuestFindMany.mockResolvedValue([
        {
          id: "q1",
          key: "daily_post",
          criteria: { action: "post:create", count: 1 },
          repeatable: false,
          xpReward: 30,
        },
      ]);
      mockUserQuestProgressFindMany.mockResolvedValue([
        { questId: "q1", progress: 1, completed: true, resetAt: null, completedAt: new Date() },
      ]);

      const results = await updateQuestProgress("u1", "post:create");
      expect(results).toHaveLength(0);
    });

    test("skips quests for different actions", async () => {
      mockQuestFindMany.mockResolvedValue([
        {
          id: "q1",
          key: "daily_post",
          criteria: { action: "post:create", count: 1 },
          repeatable: false,
          xpReward: 30,
        },
      ]);

      const results = await updateQuestProgress("u1", "shout:create");
      expect(results).toHaveLength(0);
    });
  });

  describe("resetDailyQuests", () => {
    test("resets daily quests and returns count", async () => {
      mockUserQuestProgressUpdateMany.mockResolvedValue({ count: 5 });
      const count = await resetDailyQuests();
      expect(count).toBe(5);
      expect(mockUserQuestProgressUpdateMany).toHaveBeenCalledWith({
        where: { quest: { type: "daily", repeatable: true }, completed: true },
        data: expect.objectContaining({ progress: 0, completed: false }),
      });
    });
  });

  describe("resetWeeklyQuests", () => {
    test("resets weekly quests and returns count", async () => {
      mockUserQuestProgressUpdateMany.mockResolvedValue({ count: 3 });
      const count = await resetWeeklyQuests();
      expect(count).toBe(3);
      expect(mockUserQuestProgressUpdateMany).toHaveBeenCalledWith({
        where: { quest: { type: "weekly", repeatable: true }, completed: true },
        data: expect.objectContaining({ progress: 0, completed: false }),
      });
    });
  });
});

describe("login-streak", () => {
  describe("recordLogin", () => {
    test("creates new streak for first login", async () => {
      mockLoginStreakFindUnique.mockResolvedValue(null);
      mockLoginStreakCreate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 10, level: 1, userId: "u1" });
      mockQuestFindMany.mockResolvedValue([]);

      const result = await recordLogin("u1");
      expect(result.streak).toBe(1);
      expect(result.isNewDay).toBe(true);
      expect(mockLoginStreakCreate).toHaveBeenCalled();
    });

    test("returns same-day login without awarding xp", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      mockLoginStreakFindUnique.mockResolvedValue({
        userId: "u1",
        currentStreak: 3,
        longestStreak: 5,
        lastLoginDate: today,
      });

      const result = await recordLogin("u1");
      expect(result.streak).toBe(3);
      expect(result.xpAwarded).toBe(0);
      expect(result.isNewDay).toBe(false);
    });

    test("increments streak for consecutive day", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      mockLoginStreakFindUnique.mockResolvedValue({
        userId: "u1",
        currentStreak: 2,
        longestStreak: 5,
        lastLoginDate: yesterday,
      });
      mockLoginStreakUpdate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 30, level: 1, userId: "u1" });
      mockQuestFindMany.mockResolvedValue([]);
      mockAchievementFindMany.mockResolvedValue([]);
      mockUserAchievementFindMany.mockResolvedValue([]);

      const result = await recordLogin("u1");
      expect(result.streak).toBe(3);
      expect(result.isNewDay).toBe(true);
    });

    test("resets streak after gap", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      mockLoginStreakFindUnique.mockResolvedValue({
        userId: "u1",
        currentStreak: 10,
        longestStreak: 10,
        lastLoginDate: threeDaysAgo,
      });
      mockLoginStreakUpdate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 10, level: 1, userId: "u1" });
      mockQuestFindMany.mockResolvedValue([]);
      mockAchievementFindMany.mockResolvedValue([]);
      mockUserAchievementFindMany.mockResolvedValue([]);

      const result = await recordLogin("u1");
      expect(result.streak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });
  });

  describe("getLoginStreak", () => {
    test("returns streak data when exists", async () => {
      mockLoginStreakFindUnique.mockResolvedValue({
        userId: "u1",
        currentStreak: 5,
        longestStreak: 12,
        lastLoginDate: new Date(),
      });
      const streak = await getLoginStreak("u1");
      expect(streak.currentStreak).toBe(5);
      expect(streak.longestStreak).toBe(12);
    });

    test("returns defaults when no streak exists", async () => {
      mockLoginStreakFindUnique.mockResolvedValue(null);
      const streak = await getLoginStreak("u1");
      expect(streak).toEqual({ currentStreak: 0, longestStreak: 0, lastLoginDate: null });
    });
  });
});

describe("trigger", () => {
  describe("triggerGamification", () => {
    test("calls all three gamification services", async () => {
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({ totalXp: 15, level: 1, userId: "u1" });
      mockQuestFindMany.mockResolvedValue([]);
      mockAchievementFindMany.mockResolvedValue([]);
      mockUserAchievementFindMany.mockResolvedValue([]);

      await triggerGamification("u1", "issue:create", "issue-1");

      expect(mockXpTransactionCreate).toHaveBeenCalled();
      expect(mockQuestFindMany).toHaveBeenCalled();
      expect(mockAchievementFindMany).toHaveBeenCalled();
    });

    test("does not throw on error", async () => {
      mockXpTransactionCreate.mockRejectedValue(new Error("db error"));
      mockQuestFindMany.mockRejectedValue(new Error("db error"));
      mockAchievementFindMany.mockRejectedValue(new Error("db error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(triggerGamification("u1", "issue:create")).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });
});

// ─── Additional coverage tests ──────────────────────────────────────────────

describe("achievement-service extended", () => {
  test("getAllAchievementsWithStatus returns achievements with unlock status", async () => {
    mockAchievementFindMany.mockResolvedValue([
      { id: "a1", key: "test", name: "Test", category: "onboarding", sortOrder: 1 },
    ]);
    mockUserAchievementFindMany.mockResolvedValue([
      { achievementId: "a1", unlockedAt: new Date("2026-04-01") },
    ]);

    const result = await getAllAchievementsWithStatus("u1");
    expect(result).toHaveLength(1);
    expect(result[0].unlocked).toBe(true);
    expect(result[0].unlockedAt).toBeDefined();
  });

  test("getAllAchievementsWithStatus marks locked achievements", async () => {
    mockAchievementFindMany.mockResolvedValue([{ id: "a1", key: "test" }]);
    mockUserAchievementFindMany.mockResolvedValue([]);

    const result = await getAllAchievementsWithStatus("u1");
    expect(result[0].unlocked).toBe(false);
    expect(result[0].unlockedAt).toBeNull();
  });

  test("getAllAchievementsWithStatus returns empty on error", async () => {
    mockAchievementFindMany.mockRejectedValue(new Error("db error"));
    const result = await getAllAchievementsWithStatus("u1");
    expect(result).toEqual([]);
  });

  test("getUserAchievements returns unlocked achievements", async () => {
    mockUserAchievementFindMany.mockResolvedValue([
      { achievement: { id: "a1", name: "Test", key: "test" }, unlockedAt: new Date("2026-04-01") },
    ]);
    const result = await getUserAchievements("u1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test");
    expect(result[0].unlockedAt).toBeDefined();
  });

  test("checkAchievements handles issue:create action", async () => {
    mockAchievementFindMany.mockResolvedValue([
      {
        id: "a1",
        key: "bug_hunter",
        criteria: { type: "count", action: "issue:create", threshold: 1 },
        xpReward: 30,
      },
    ]);
    mockUserAchievementFindMany.mockResolvedValue([]);
    mockIssueReportCount.mockResolvedValue(1);
    mockUserAchievementCreate.mockResolvedValue({});
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({});
    const results = await checkAchievements("u1", "issue:create");
    expect(results).toHaveLength(1);
  });

  test("checkAchievements handles survey:complete action", async () => {
    mockAchievementFindMany.mockResolvedValue([
      {
        id: "a1",
        key: "surveyor",
        criteria: { type: "count", action: "survey:complete", threshold: 1 },
        xpReward: 50,
      },
    ]);
    mockUserAchievementFindMany.mockResolvedValue([]);
    mockSurveyResponseCount.mockResolvedValue(1);
    mockUserAchievementCreate.mockResolvedValue({});
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({});
    const results = await checkAchievements("u1", "survey:complete");
    expect(results).toHaveLength(1);
  });

  test("checkAchievements handles alias:set action", async () => {
    mockAchievementFindMany.mockResolvedValue([
      {
        id: "a1",
        key: "welcome",
        criteria: { type: "count", action: "alias:set", threshold: 1 },
        xpReward: 25,
      },
    ]);
    mockUserAchievementFindMany.mockResolvedValue([]);
    mockUserFindUnique.mockResolvedValue({ alias: "TestUser" });
    mockUserAchievementCreate.mockResolvedValue({});
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({});
    const results = await checkAchievements("u1", "alias:set");
    expect(results).toHaveLength(1);
  });

  test("checkAchievements handles login:streak action", async () => {
    mockAchievementFindMany.mockResolvedValue([
      {
        id: "a1",
        key: "streak_bronze",
        criteria: { type: "count", action: "login:streak", threshold: 7 },
        xpReward: 75,
      },
    ]);
    mockUserAchievementFindMany.mockResolvedValue([]);
    mockLoginStreakFindUnique.mockResolvedValue({ longestStreak: 7 });
    mockUserAchievementCreate.mockResolvedValue({});
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({});
    const results = await checkAchievements("u1", "login:streak");
    expect(results).toHaveLength(1);
  });

  test("checkAchievements handles feedback:submit action", async () => {
    mockAchievementFindMany.mockResolvedValue([
      {
        id: "a1",
        key: "feedback_first",
        criteria: { type: "count", action: "feedback:submit", threshold: 1 },
        xpReward: 25,
      },
    ]);
    mockUserAchievementFindMany.mockResolvedValue([]);
    mockFeedbackCount.mockResolvedValue(1);
    mockUserAchievementCreate.mockResolvedValue({});
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({});

    const results = await checkAchievements("u1", "feedback:submit");
    expect(results).toHaveLength(1);
    expect(results[0].achievementKey).toBe("feedback_first");
  });
});

describe("xp-service extended", () => {
  test("awardXp enforces daily DM XP cap", async () => {
    mockXpTransactionAggregate.mockResolvedValue({ _sum: { amount: 15 } });
    const result = await awardXp("u1", "dm:send");
    expect(result).toBeNull();
  });

  test("awardXp allows DM XP below cap", async () => {
    mockXpTransactionAggregate.mockResolvedValue({ _sum: { amount: 12 } });
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({ totalXp: 15, level: 1, userId: "u1" });
    const result = await awardXp("u1", "dm:send");
    expect(result).not.toBeNull();
    expect(result!.xpAwarded).toBe(3);
  });

  test("awardCustomXp awards custom amount", async () => {
    mockXpTransactionCreate.mockResolvedValue({});
    mockUserLevelUpsert.mockResolvedValue({ totalXp: 100, level: 1, userId: "u1" });
    mockUserLevelUpdate.mockResolvedValue({});
    const result = await awardCustomXp("u1", 100, "custom_quest:complete", "q1");
    expect(result).not.toBeNull();
    expect(result!.xpAwarded).toBe(100);
  });

  test("awardCustomXp returns null for zero amount", async () => {
    const result = await awardCustomXp("u1", 0, "custom_quest:complete");
    expect(result).toBeNull();
  });

  test("getLeaderboard returns ranked entries", async () => {
    mockUserLevelFindMany.mockResolvedValue([
      {
        userId: "u1",
        totalXp: 500,
        level: 3,
        user: {
          id: "u1",
          alias: "Alice",
          name: "Alice A",
          image: null,
          avatarUrl: "/a.png",
          role: "user",
        },
      },
    ]);
    const lb = await getLeaderboard(10);
    expect(lb).toHaveLength(1);
    expect(lb[0].rank).toBe(1);
    expect(lb[0].alias).toBe("Alice");
  });

  test("getLeaderboard returns empty on error", async () => {
    mockUserLevelFindMany.mockRejectedValue(new Error("db error"));
    const lb = await getLeaderboard();
    expect(lb).toEqual([]);
  });

  test("getRecentXpTransactions returns transactions", async () => {
    mockXpTransactionFindMany.mockResolvedValue([{ id: "t1", amount: 10 }]);
    const txs = await getRecentXpTransactions("u1");
    expect(txs).toHaveLength(1);
  });
});

describe("quest-service extended", () => {
  test("getActiveQuests returns quests with progress", async () => {
    mockQuestFindMany.mockResolvedValue([
      {
        id: "q1",
        key: "daily_login",
        name: "Check In",
        description: "Log in",
        icon: "☀️",
        type: "daily",
        xpReward: 10,
        repeatable: true,
        criteria: { action: "daily:login", count: 1 },
        sortOrder: 1,
      },
    ]);
    mockUserQuestProgressFindMany.mockResolvedValue([
      { questId: "q1", progress: 1, completed: true, completedAt: new Date(), resetAt: null },
    ]);

    const result = await getActiveQuests("u1");
    expect(result).toHaveLength(1);
    expect(result[0].completed).toBe(true);
    expect(result[0].progress).toBe(1);
  });

  test("getActiveQuests resets repeatable quest after resetAt", async () => {
    const completedAt = new Date("2026-04-01");
    const resetAt = new Date("2026-04-02");
    mockQuestFindMany.mockResolvedValue([
      {
        id: "q1",
        key: "daily",
        name: "Daily",
        description: "",
        icon: "",
        type: "daily",
        xpReward: 10,
        repeatable: true,
        criteria: { action: "daily:login", count: 1 },
        sortOrder: 1,
      },
    ]);
    mockUserQuestProgressFindMany.mockResolvedValue([
      { questId: "q1", progress: 1, completed: true, completedAt, resetAt },
    ]);

    const result = await getActiveQuests("u1");
    expect(result[0].completed).toBe(false);
  });

  test("getActiveQuests returns empty on error", async () => {
    mockQuestFindMany.mockRejectedValue(new Error("db error"));
    const result = await getActiveQuests("u1");
    expect(result).toEqual([]);
  });
});
