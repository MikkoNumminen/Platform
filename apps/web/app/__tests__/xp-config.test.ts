import {
  XP_AMOUNTS,
  LEVEL_THRESHOLDS,
  getLevelForXp,
  getNextLevel,
  getXpProgress,
  DAILY_SHOUT_XP_CAP,
} from "@/lib/gamification/xp-config";

describe("xp-config", () => {
  describe("XP_AMOUNTS", () => {
    test("defines xp for all expected sources", () => {
      expect(XP_AMOUNTS["post:create"]).toBe(20);
      expect(XP_AMOUNTS["thread:create"]).toBe(10);
      expect(XP_AMOUNTS["topic:create"]).toBe(15);
      expect(XP_AMOUNTS["event:create"]).toBe(20);
      expect(XP_AMOUNTS["shout:create"]).toBe(5);
      expect(XP_AMOUNTS["issue:create"]).toBe(15);
      expect(XP_AMOUNTS["alias:set"]).toBe(25);
      expect(XP_AMOUNTS["survey:complete"]).toBe(100);
      expect(XP_AMOUNTS["daily:login"]).toBe(10);
      expect(XP_AMOUNTS["streak:7day"]).toBe(50);
      expect(XP_AMOUNTS["streak:30day"]).toBe(200);
      expect(XP_AMOUNTS["quest:complete"]).toBe(0);
    });

    test("quest:complete awards zero xp directly", () => {
      expect(XP_AMOUNTS["quest:complete"]).toBe(0);
    });
  });

  describe("LEVEL_THRESHOLDS", () => {
    test("has 10 levels", () => {
      expect(LEVEL_THRESHOLDS).toHaveLength(10);
    });

    test("starts at level 1 with 0 xp required", () => {
      expect(LEVEL_THRESHOLDS[0]).toEqual({ level: 1, xpRequired: 0, title: "Newcomer" });
    });

    test("ends at level 10 with 10000 xp required", () => {
      expect(LEVEL_THRESHOLDS[9]).toEqual({ level: 10, xpRequired: 10000, title: "Mythic" });
    });

    test("levels are in ascending order", () => {
      for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].level).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1].level);
        expect(LEVEL_THRESHOLDS[i].xpRequired).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1].xpRequired);
      }
    });
  });

  describe("DAILY_SHOUT_XP_CAP", () => {
    test("is 25", () => {
      expect(DAILY_SHOUT_XP_CAP).toBe(25);
    });
  });

  describe("getLevelForXp", () => {
    test("returns level 1 for 0 xp", () => {
      expect(getLevelForXp(0)).toEqual({ level: 1, xpRequired: 0, title: "Newcomer" });
    });

    test("returns level 1 for xp below level 2 threshold", () => {
      expect(getLevelForXp(99)).toEqual({ level: 1, xpRequired: 0, title: "Newcomer" });
    });

    test("returns level 2 at exactly 100 xp", () => {
      expect(getLevelForXp(100)).toEqual({ level: 2, xpRequired: 100, title: "Member" });
    });

    test("returns level 5 at exactly 1000 xp", () => {
      expect(getLevelForXp(1000)).toEqual({ level: 5, xpRequired: 1000, title: "Regular" });
    });

    test("returns level 10 at exactly 10000 xp", () => {
      expect(getLevelForXp(10000)).toEqual({ level: 10, xpRequired: 10000, title: "Mythic" });
    });

    test("returns level 10 for xp beyond max threshold", () => {
      expect(getLevelForXp(99999)).toEqual({ level: 10, xpRequired: 10000, title: "Mythic" });
    });

    test("returns level 1 for negative xp", () => {
      expect(getLevelForXp(-10)).toEqual({ level: 1, xpRequired: 0, title: "Newcomer" });
    });
  });

  describe("getNextLevel", () => {
    test("returns level 2 for current level 1", () => {
      expect(getNextLevel(1)).toEqual({ level: 2, xpRequired: 100, title: "Member" });
    });

    test("returns null for max level (10)", () => {
      expect(getNextLevel(10)).toBeNull();
    });

    test("returns null for invalid level", () => {
      expect(getNextLevel(999)).toBeNull();
    });

    test("returns correct next level for mid-range", () => {
      const next = getNextLevel(5);
      expect(next).toEqual({ level: 6, xpRequired: 1500, title: "Veteran" });
    });
  });

  describe("getXpProgress", () => {
    test("returns 0% progress at start of level 1", () => {
      const progress = getXpProgress(0);
      expect(progress.current.level).toBe(1);
      expect(progress.next?.level).toBe(2);
      expect(progress.xpIntoLevel).toBe(0);
      expect(progress.xpForNextLevel).toBe(100);
      expect(progress.progressPercent).toBe(0);
    });

    test("returns 50% progress at halfway through a level", () => {
      const progress = getXpProgress(50);
      expect(progress.current.level).toBe(1);
      expect(progress.progressPercent).toBe(50);
    });

    test("returns 100% at max level", () => {
      const progress = getXpProgress(10000);
      expect(progress.current.level).toBe(10);
      expect(progress.next).toBeNull();
      expect(progress.progressPercent).toBe(100);
    });

    test("caps progress at 100%", () => {
      const progress = getXpProgress(99999);
      expect(progress.progressPercent).toBe(100);
    });
  });
});
