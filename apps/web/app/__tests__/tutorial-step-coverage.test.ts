import { TUTORIAL_STEPS, ROLE_TIER, getStepsForRole } from "@/lib/tutorial/tutorial-config";
import { DEMO_USERS } from "@/lib/demo-seeds";
import { execSync } from "child_process";
import path from "path";

// Scan the actual source files for data-tutorial attributes
function findDataTutorialAttributes(): Set<string> {
  const webRoot = path.resolve(__dirname, "../../");
  const result = execSync(
    `grep -rEo 'data-tutorial="[^"]+"' "${webRoot}/app" --include="*.tsx" --include="*.ts"`,
    { encoding: "utf-8" },
  );
  const attrs = new Set<string>();
  for (const line of result.split("\n").filter(Boolean)) {
    const match = line.match(/data-tutorial="([^"]+)"/);
    if (match) attrs.add(match[1]);
  }
  return attrs;
}

describe("tutorial step coverage", () => {
  const codebaseAttrs = findDataTutorialAttributes();

  describe("every tutorial step has a matching data-tutorial attribute in the UI", () => {
    for (const step of TUTORIAL_STEPS) {
      const selectorMatch = step.targetSelector.match(/data-tutorial="([^"]+)"/);
      if (selectorMatch) {
        const attr = selectorMatch[1];
        test(`step "${step.id}" → data-tutorial="${attr}" exists in codebase`, () => {
          expect(codebaseAttrs.has(attr)).toBe(true);
        });
      }
    }
  });

  describe("tutorial step IDs are unique", () => {
    test("no duplicate step IDs", () => {
      const ids = TUTORIAL_STEPS.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("tier assignments are correct", () => {
    test("tier 1 steps are for pending users", () => {
      const tier1 = TUTORIAL_STEPS.filter((s) => s.tier === 1);
      expect(tier1.length).toBe(3);
      expect(tier1.map((s) => s.id)).toEqual(
        expect.arrayContaining(["set_alias", "complete_survey", "report_issue"]),
      );
    });

    test("tier 2 steps are for regular users", () => {
      const tier2 = TUTORIAL_STEPS.filter((s) => s.tier === 2);
      expect(tier2.length).toBe(5);
      expect(tier2.map((s) => s.id)).toEqual(
        expect.arrayContaining([
          "explore_home",
          "write_comment",
          "check_quests",
          "view_achievements",
          "check_leaderboard",
        ]),
      );
    });

    test("tier 3 steps are for admins", () => {
      const tier3 = TUTORIAL_STEPS.filter((s) => s.tier === 3);
      expect(tier3.length).toBe(2);
    });

    test("tier 4 steps are for vuohi/superuser", () => {
      const tier4 = TUTORIAL_STEPS.filter((s) => s.tier === 4);
      expect(tier4.length).toBe(3);
    });
  });

  describe("demo user gets all tutorial steps (superuser)", () => {
    test("demo user role is superuser, which maps to tier 4", () => {
      // Demo user is created as superuser in auth.ts
      expect(ROLE_TIER["superuser"]).toBe(4);
    });

    test("superuser gets all 13 steps", () => {
      const steps = getStepsForRole("superuser");
      expect(steps).toHaveLength(13);
      expect(steps).toHaveLength(TUTORIAL_STEPS.length);
    });
  });

  describe("demo seed users cover the tutorial role spectrum", () => {
    test("demo has users at each tier level", () => {
      const demoRoles = new Set(DEMO_USERS.map((u) => u.role));
      // Tier 1: pending
      expect(demoRoles.has("pending")).toBe(true);
      // Tier 2: user
      expect(demoRoles.has("user")).toBe(true);
      // Tier 3: admin
      expect(demoRoles.has("admin")).toBe(true);
      // Tier 4: vuohi (or superuser — demo main user is superuser)
      expect(demoRoles.has("vuohi")).toBe(true);
    });

    test("demo has pending users for the approve_user tutorial step", () => {
      const pendingUsers = DEMO_USERS.filter((u) => u.role === "pending");
      expect(pendingUsers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("every step with an event has a valid event name format", () => {
    test("event names follow tutorial:* pattern", () => {
      const eventSteps = TUTORIAL_STEPS.filter((s) => s.event);
      expect(eventSteps.length).toBeGreaterThan(0);
      for (const step of eventSteps) {
        expect(step.event).toMatch(/^tutorial:/);
      }
    });
  });

  describe("autoCompleteOnRoute steps have string routes", () => {
    test("auto-complete steps use exact string routes", () => {
      const autoSteps = TUTORIAL_STEPS.filter((s) => s.autoCompleteOnRoute);
      for (const step of autoSteps) {
        expect(typeof step.route).toBe("string");
      }
    });
  });

  describe("navigation hints reference valid selectors", () => {
    test("hint targetSelectors use data-tutorial format", () => {
      for (const step of TUTORIAL_STEPS) {
        if (step.navigationHints) {
          for (const hint of step.navigationHints) {
            expect(hint.targetSelector).toMatch(/data-tutorial=/);
            expect(hint.hintKey).toBeTruthy();
          }
        }
      }
    });
  });

  describe("XP rewards are configured", () => {
    test("all steps award XP", () => {
      for (const step of TUTORIAL_STEPS) {
        expect(step.xpReward).toBeGreaterThan(0);
      }
    });

    test("total tutorial XP is reasonable", () => {
      const totalXp = TUTORIAL_STEPS.reduce((sum, s) => sum + s.xpReward, 0);
      expect(totalXp).toBeGreaterThanOrEqual(100);
      expect(totalXp).toBeLessThanOrEqual(500);
    });
  });
});
