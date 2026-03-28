/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Mock function declarations (hoisted by jest) ---
const mockUserTourProgressFindUnique = jest.fn();
const mockUserTourProgressFindMany = jest.fn();
const mockUserTourProgressCreate = jest.fn();
const mockUserTourProgressDeleteMany = jest.fn();
const mockXpTransactionCreate = jest.fn();
const mockUserLevelUpsert = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    userTourProgress: {
      findUnique: (...a: any[]) => mockUserTourProgressFindUnique(...a),
      findMany: (...a: any[]) => mockUserTourProgressFindMany(...a),
      create: (...a: any[]) => mockUserTourProgressCreate(...a),
      deleteMany: (...a: any[]) => mockUserTourProgressDeleteMany(...a),
    },
    xpTransaction: {
      create: (...a: any[]) => mockXpTransactionCreate(...a),
    },
    userLevel: {
      upsert: (...a: any[]) => mockUserLevelUpsert(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));

jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: jest.fn(),
}));

import { auth } from "@/auth";
import {
  completeTourStep,
  getTourProgress,
  resetTour,
  getMyTourProgress,
} from "@/lib/tutorial/tutorial-service";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("tutorial-service", () => {
  describe("completeTourStep", () => {
    test("returns null for unauthenticated users", async () => {
      mockAuth.mockResolvedValue(null as any);

      const result = await completeTourStep("set_alias");
      expect(result).toEqual({ completed: false, tierCompleted: null, tierBonus: 0 });
    });

    test("rejects invalid step for role", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: "pending" },
      } as any);

      // "explore_home" is tier 2, not available for pending
      const result = await completeTourStep("explore_home");
      expect(result).toEqual({ completed: false, tierCompleted: null, tierBonus: 0 });
    });

    test("skips already completed steps", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: "user" },
      } as any);
      mockUserTourProgressFindUnique.mockResolvedValue({ userId: "u1", stepId: "set_alias" });

      const result = await completeTourStep("set_alias");
      expect(result).toEqual({ completed: false, tierCompleted: null, tierBonus: 0 });
      expect(mockUserTourProgressCreate).not.toHaveBeenCalled();
    });

    test("creates progress and awards XP for valid step", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: "user" },
      } as any);
      mockUserTourProgressFindUnique.mockResolvedValue(null);
      mockUserTourProgressCreate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({});
      // After completion, only this step is done — not all tier 1 steps
      mockUserTourProgressFindMany.mockResolvedValue([{ stepId: "set_alias" }]);

      const result = await completeTourStep("set_alias");
      expect(result.completed).toBe(true);
      expect(mockUserTourProgressCreate).toHaveBeenCalledWith({
        data: { userId: "u1", stepId: "set_alias" },
      });
      expect(mockXpTransactionCreate).toHaveBeenCalled();
      expect(mockUserLevelUpsert).toHaveBeenCalled();
    });

    test("returns tierCompleted when tier is finished", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: "pending" },
      } as any);
      mockUserTourProgressFindUnique.mockResolvedValue(null);
      mockUserTourProgressCreate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({});
      // All 3 tier-1 steps are now complete
      mockUserTourProgressFindMany.mockResolvedValue([
        { stepId: "set_alias" },
        { stepId: "complete_survey" },
        { stepId: "report_issue" },
      ]);

      const result = await completeTourStep("report_issue");
      expect(result.completed).toBe(true);
      expect(result.tierCompleted).toBe(1);
      expect(result.tierBonus).toBe(50);
    });

    test("awards tier bonus XP when tier is completed", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: "pending" },
      } as any);
      mockUserTourProgressFindUnique.mockResolvedValue(null);
      mockUserTourProgressCreate.mockResolvedValue({});
      mockXpTransactionCreate.mockResolvedValue({});
      mockUserLevelUpsert.mockResolvedValue({});
      // All tier-1 steps complete
      mockUserTourProgressFindMany.mockResolvedValue([
        { stepId: "set_alias" },
        { stepId: "complete_survey" },
        { stepId: "report_issue" },
      ]);

      await completeTourStep("report_issue");

      // Should have created XP transactions for both the step and the tier bonus
      // Step XP + tier bonus XP = at least 2 XP transaction calls
      expect(mockXpTransactionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: "tour:tier",
            sourceId: "tier_1",
            amount: 50,
          }),
        }),
      );
    });
  });

  describe("getTourProgress", () => {
    test("returns completed step IDs", async () => {
      mockUserTourProgressFindMany.mockResolvedValue([
        { stepId: "set_alias" },
        { stepId: "explore_home" },
      ]);

      const result = await getTourProgress("u1");
      expect(result).toEqual(["set_alias", "explore_home"]);
    });

    test("returns empty array when no progress exists", async () => {
      mockUserTourProgressFindMany.mockResolvedValue([]);

      const result = await getTourProgress("u1");
      expect(result).toEqual([]);
    });
  });

  describe("resetTour", () => {
    test("deletes all progress for user", async () => {
      mockUserTourProgressDeleteMany.mockResolvedValue({ count: 5 });

      await resetTour("u1");
      expect(mockUserTourProgressDeleteMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
      });
    });
  });

  describe("getMyTourProgress", () => {
    test("returns steps and role for authenticated user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: "user" },
      } as any);
      mockUserTourProgressFindMany.mockResolvedValue([{ stepId: "set_alias" }]);

      const result = await getMyTourProgress();
      expect(result).toEqual({
        completedSteps: ["set_alias"],
        role: "user",
      });
    });

    test("returns null for unauthenticated user", async () => {
      mockAuth.mockResolvedValue(null as any);

      const result = await getMyTourProgress();
      expect(result).toBeNull();
    });
  });
});
