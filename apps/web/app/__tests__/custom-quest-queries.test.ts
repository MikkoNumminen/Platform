/* eslint-disable @typescript-eslint/no-explicit-any */

const mockCustomQuestFindMany = jest.fn();
const mockCustomQuestFindFirst = jest.fn();
const mockCustomQuestCount = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    customQuest: {
      findMany: (...a: any[]) => mockCustomQuestFindMany(...a),
      findFirst: (...a: any[]) => mockCustomQuestFindFirst(...a),
      count: (...a: any[]) => mockCustomQuestCount(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));

import { auth } from "@/auth";
import {
  getAllCustomQuests,
  getMyCustomQuests,
  getCustomQuestById,
  getCustomQuestCounts,
  getRecentCompletedQuests,
} from "@/lib/custom-quest-queries";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

beforeEach(() => jest.clearAllMocks());

describe("getAllCustomQuests", () => {
  test("returns empty without quest:view permission", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: {} } } as any);
    expect(await getAllCustomQuests()).toEqual([]);
  });

  test("returns quests with quest:view permission", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "quest:view": true } } } as any);
    mockCustomQuestFindMany.mockResolvedValue([{ id: "q1", title: "Quest 1" }]);
    const result = await getAllCustomQuests();
    expect(result).toHaveLength(1);
  });

  test("filters by status", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "quest:manage": true } } } as any);
    mockCustomQuestFindMany.mockResolvedValue([]);
    await getAllCustomQuests({ status: "open" });
    expect(mockCustomQuestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "open" }) }),
    );
  });
});

describe("getMyCustomQuests", () => {
  test("returns empty when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    expect(await getMyCustomQuests()).toEqual([]);
  });

  test("returns user's quests", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as any);
    mockCustomQuestFindMany.mockResolvedValue([{ id: "q1" }]);
    const result = await getMyCustomQuests();
    expect(result).toHaveLength(1);
  });
});

describe("getCustomQuestById", () => {
  test("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    expect(await getCustomQuestById("q1")).toBeNull();
  });

  test("returns null when quest not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    mockCustomQuestFindFirst.mockResolvedValue(null);
    expect(await getCustomQuestById("q1")).toBeNull();
  });

  test("returns quest for assignee", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    mockCustomQuestFindFirst.mockResolvedValue({ id: "q1", assignee: { id: "u1" } });
    const result = await getCustomQuestById("q1");
    expect(result?.id).toBe("q1");
  });

  test("returns null for non-assignee without permission", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    mockCustomQuestFindFirst.mockResolvedValue({ id: "q1", assignee: { id: "u2" } });
    expect(await getCustomQuestById("q1")).toBeNull();
  });

  test("returns quest for admin with quest:view", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "quest:view": true } } } as any);
    mockCustomQuestFindFirst.mockResolvedValue({ id: "q1", assignee: { id: "u2" } });
    const result = await getCustomQuestById("q1");
    expect(result?.id).toBe("q1");
  });
});

describe("getCustomQuestCounts", () => {
  test("returns zeros without permission", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: {} } } as any);
    expect(await getCustomQuestCounts()).toEqual({
      open: 0,
      inProgress: 0,
      completed: 0,
      total: 0,
    });
  });

  test("returns counts with permission", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "quest:view": true } } } as any);
    mockCustomQuestCount.mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(5);
    const result = await getCustomQuestCounts();
    expect(result).toEqual({ open: 3, inProgress: 2, completed: 5, total: 10 });
  });
});

describe("getRecentCompletedQuests", () => {
  test("returns completed quests", async () => {
    mockCustomQuestFindMany.mockResolvedValue([
      {
        id: "q1",
        title: "Done",
        xpReward: 50,
        targetSkill: null,
        completedAt: new Date(),
        assignee: { alias: "Bob", name: null },
      },
    ]);
    const result = await getRecentCompletedQuests();
    expect(result).toHaveLength(1);
  });
});
