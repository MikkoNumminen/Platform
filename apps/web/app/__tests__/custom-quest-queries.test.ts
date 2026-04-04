const mockQuestFindMany = jest.fn();
const mockQuestFindFirst = jest.fn();
const mockQuestCount = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    quest: {
      findMany: (...a: any[]) => mockQuestFindMany(...a),
      findFirst: (...a: any[]) => mockQuestFindFirst(...a),
      count: (...a: any[]) => mockQuestCount(...a),
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
    mockQuestFindMany.mockResolvedValue([
      {
        id: "q1",
        name: "Quest 1",
        assignee: { id: "u1", alias: null, name: null, image: null },
        creator: { id: "u2", alias: null, name: null },
      },
    ]);
    const result = await getAllCustomQuests();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Quest 1");
  });

  test("filters by status", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "quest:manage": true } } } as any);
    mockQuestFindMany.mockResolvedValue([]);
    await getAllCustomQuests({ status: "open" });
    expect(mockQuestFindMany).toHaveBeenCalledWith(
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
    mockQuestFindMany.mockResolvedValue([
      {
        id: "q1",
        name: "Quest",
        assignee: { id: "u1", alias: null, name: null, image: null },
        creator: { id: "u2", alias: null, name: null },
      },
    ]);
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
    mockQuestFindFirst.mockResolvedValue(null);
    expect(await getCustomQuestById("q1")).toBeNull();
  });

  test("returns quest for assignee", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    mockQuestFindFirst.mockResolvedValue({
      id: "q1",
      name: "Quest",
      assignee: { id: "u1", alias: null, name: null, image: null },
      creator: { id: "u2", alias: null, name: null },
    });
    const result = await getCustomQuestById("q1");
    expect(result?.id).toBe("q1");
  });

  test("returns null for non-assignee without permission", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    mockQuestFindFirst.mockResolvedValue({
      id: "q1",
      name: "Quest",
      assignee: { id: "u2", alias: null, name: null, image: null },
      creator: { id: "u3", alias: null, name: null },
    });
    expect(await getCustomQuestById("q1")).toBeNull();
  });

  test("returns quest for admin with quest:view", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: { "quest:view": true } } } as any);
    mockQuestFindFirst.mockResolvedValue({
      id: "q1",
      name: "Quest",
      assignee: { id: "u2", alias: null, name: null, image: null },
      creator: { id: "u3", alias: null, name: null },
    });
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
    mockQuestCount.mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(5);
    const result = await getCustomQuestCounts();
    expect(result).toEqual({ open: 3, inProgress: 2, completed: 5, total: 10 });
  });
});

describe("getRecentCompletedQuests", () => {
  test("returns completed quests", async () => {
    mockQuestFindMany.mockResolvedValue([
      {
        id: "q1",
        name: "Done",
        xpReward: 50,
        targetSkill: null,
        completedAt: new Date(),
        assignee: { alias: "Bob", name: null },
      },
    ]);
    const result = await getRecentCompletedQuests();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Done");
  });
});
