import {
  TUTORIAL_STEPS,
  TIER_NAMES,
  TIER_XP_BONUS,
  ROLE_TIER,
  getStepsForRole,
  matchRoute,
} from "@/lib/tutorial/tutorial-config";

describe("tutorial-config", () => {
  describe("getStepsForRole", () => {
    test('returns 3 steps for "pending" (tier 1 only)', () => {
      const steps = getStepsForRole("pending");
      expect(steps).toHaveLength(3);
      expect(steps.every((s) => s.tier === 1)).toBe(true);
    });

    test('returns 10 steps for "user" (tier 1+2)', () => {
      const steps = getStepsForRole("user");
      expect(steps).toHaveLength(10);
      expect(steps.every((s) => s.tier <= 2)).toBe(true);
    });

    test('returns 14 steps for "admin" (tier 1+2+3)', () => {
      const steps = getStepsForRole("admin");
      expect(steps).toHaveLength(14);
      expect(steps.every((s) => s.tier <= 3)).toBe(true);
    });

    test('returns 17 steps for "vuohi" (all tiers)', () => {
      const steps = getStepsForRole("vuohi");
      expect(steps).toHaveLength(17);
    });

    test('returns 17 steps for "superuser" (all tiers)', () => {
      const steps = getStepsForRole("superuser");
      expect(steps).toHaveLength(17);
    });

    test("returns 3 steps for unknown role (defaults to tier 1)", () => {
      const steps = getStepsForRole("unknown");
      expect(steps).toHaveLength(3);
      expect(steps.every((s) => s.tier === 1)).toBe(true);
    });
  });

  describe("matchRoute", () => {
    test("matches exact string routes", () => {
      expect(matchRoute("/boards", "/boards")).toBe(true);
      expect(matchRoute("/", "/")).toBe(true);
    });

    test("returns false for non-matching string routes", () => {
      expect(matchRoute("/boards", "/quests")).toBe(false);
      expect(matchRoute("/boards", "/boards/general")).toBe(false);
    });

    test("matches regex patterns", () => {
      expect(matchRoute(/^\/boards\/[^/]+$/, "/boards/general")).toBe(true);
      expect(matchRoute(/^\/boards\/[^/]+\/[^/]+$/, "/boards/general/post-1")).toBe(true);
    });

    test("returns false for non-matching regex patterns", () => {
      expect(matchRoute(/^\/boards\/[^/]+$/, "/boards")).toBe(false);
      expect(matchRoute(/^\/boards\/[^/]+$/, "/boards/general/post-1")).toBe(false);
    });
  });

  describe("TUTORIAL_STEPS", () => {
    test("all steps have required fields", () => {
      for (const step of TUTORIAL_STEPS) {
        expect(step).toHaveProperty("id");
        expect(step).toHaveProperty("route");
        expect(step).toHaveProperty("targetSelector");
        expect(step).toHaveProperty("tier");
        expect(step).toHaveProperty("xpReward");
        expect(typeof step.id).toBe("string");
        expect(typeof step.targetSelector).toBe("string");
        expect(typeof step.tier).toBe("number");
        expect(typeof step.xpReward).toBe("number");
      }
    });

    test("has unique step IDs", () => {
      const ids = TUTORIAL_STEPS.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("TIER_NAMES", () => {
    test("has entries for tiers 1 through 4", () => {
      expect(TIER_NAMES[1]).toBe("Getting Started");
      expect(TIER_NAMES[2]).toBe("Community Explorer");
      expect(TIER_NAMES[3]).toBe("Admin Basics");
      expect(TIER_NAMES[4]).toBe("Team Leader");
    });
  });

  describe("TIER_XP_BONUS", () => {
    test("has entries for tiers 1 through 4", () => {
      expect(TIER_XP_BONUS[1]).toBe(50);
      expect(TIER_XP_BONUS[2]).toBe(100);
      expect(TIER_XP_BONUS[3]).toBe(75);
      expect(TIER_XP_BONUS[4]).toBe(75);
    });
  });

  describe("ROLE_TIER", () => {
    test("maps all 5 roles", () => {
      expect(ROLE_TIER["pending"]).toBe(1);
      expect(ROLE_TIER["user"]).toBe(2);
      expect(ROLE_TIER["admin"]).toBe(3);
      expect(ROLE_TIER["vuohi"]).toBe(4);
      expect(ROLE_TIER["superuser"]).toBe(4);
    });
  });
});
