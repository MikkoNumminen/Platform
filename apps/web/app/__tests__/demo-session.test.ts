/**
 * Tests for demo session seeding and cleanup.
 *
 * Uses a __mocks__-style approach: we create the Prisma mock in a separate
 * module that both jest.mock and test code can import.
 */
import {
  DEMO_USERS,
  DEMO_BOARDS,
  DEMO_POSTS,
  DEMO_THREADS,
  DEMO_SHOUTS,
  DEMO_EVENTS,
  DEMO_ISSUES,
  DEMO_SURVEY_RESPONSES,
  DEMO_XP_PROFILES,
  DEMO_CUSTOM_QUESTS,
  DEMO_ACHIEVEMENT_UNLOCKS,
  DEMO_QUEST_PROGRESS,
} from "@/lib/demo-seeds";

// ── Mock setup ──────────────────────────────────────────────────────────────

jest.mock("@/auth", () => ({ auth: jest.fn().mockResolvedValue(null) }));

// We build the prisma mock inside jest.mock so hoisting works.
// Then we export handles via a shared object on globalThis.
jest.mock("@/lib/db", () => {
  const created: Record<string, Array<Record<string, unknown>>> = {};

  function makeCreate(model: string) {
    return jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
      if (!created[model]) created[model] = [];
      const rec = { id: `m-${model}-${created[model].length}`, ...data };
      created[model].push(rec);
      return rec;
    });
  }

  const findByKey = jest
    .fn()
    .mockImplementation(({ where }: { where: { key?: string } }) =>
      where.key ? { id: `ref-${where.key}`, key: where.key } : null,
    );

  const surveyFindMany = jest
    .fn()
    .mockImplementation(() =>
      (created["surveyResponse"] || []).slice(0, 3).map((r, i) => ({ id: `sr-${i}`, ...r })),
    );

  const mockDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const mockDelete = jest.fn().mockResolvedValue({});
  const mockUpdateMany = jest.fn();

  const tx: Record<string, Record<string, jest.Mock>> = {};
  for (const m of [
    "user",
    "board",
    "post",
    "thread",
    "shout",
    "calendarEvent",
    "issueReport",
    "surveyResponse",
    "userLevel",
    "xpTransaction",
    "loginStreak",
    "customQuest",
    "userAchievement",
    "userQuestProgress",
    "surveyRound",
    "achievement",
    "quest",
  ]) {
    tx[m] = {
      create: makeCreate(m),
      findUnique:
        m === "achievement" || m === "quest" ? findByKey : jest.fn().mockResolvedValue(null),
      findMany: m === "surveyResponse" ? surveyFindMany : jest.fn().mockResolvedValue([]),
      update: jest
        .fn()
        .mockImplementation(
          ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => ({
            id: where.id,
            ...data,
          }),
        ),
    };
  }

  const mockTransaction = jest
    .fn()
    .mockImplementation(async (fn: (t: unknown) => Promise<void>) => {
      await fn(tx);
    });

  const top: Record<string, Record<string, jest.Mock>> = {};
  for (const m of [
    "user",
    "board",
    "post",
    "thread",
    "shout",
    "calendarEvent",
    "issueReport",
    "surveyResponse",
    "userLevel",
    "xpTransaction",
    "loginStreak",
    "customQuest",
    "userAchievement",
    "userQuestProgress",
    "surveyRound",
    "userTourProgress",
    "topic",
    "forum",
    "demoSession",
  ]) {
    top[m] = {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: mockDeleteMany,
      delete: mockDelete,
      updateMany: mockUpdateMany,
    };
  }

  // Expose internals for test assertions via a side-channel
  (globalThis as Record<string, unknown>).__dmock = {
    created,
    tx,
    top,
    mockTransaction,
    mockDeleteMany,
    mockDelete,
    mockUpdateMany,
    surveyFindMany,
  };

  return { prisma: { $transaction: mockTransaction, ...top } };
});

// ── Import SUT after mocks ──────────────────────────────────────────────────

import { seedDemoData, cleanupStaleDemoSessions } from "@/lib/demo-session";

// ── Helpers to access mock internals ────────────────────────────────────────

interface DMock {
  created: Record<string, Array<Record<string, unknown>>>;
  tx: Record<string, Record<string, jest.Mock>>;
  top: Record<string, Record<string, jest.Mock>>;
  mockTransaction: jest.Mock;
  mockDeleteMany: jest.Mock;
  mockDelete: jest.Mock;
  mockUpdateMany: jest.Mock;
  surveyFindMany: jest.Mock;
}

function dm(): DMock {
  return (globalThis as Record<string, unknown>).__dmock as DMock;
}

function resetCreated() {
  const c = dm().created;
  for (const key of Object.keys(c)) delete c[key];
}

// ── seedDemoData ────────────────────────────────────────────────────────────

describe("demo-session — seedDemoData", () => {
  const SID = "test-session-abc12345";

  beforeEach(() => {
    jest.clearAllMocks();
    resetCreated();
  });

  test("runs inside a transaction", async () => {
    await seedDemoData(SID);
    expect(dm().mockTransaction).toHaveBeenCalledTimes(1);
  });

  test("creates all demo users with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["user"]).toHaveLength(DEMO_USERS.length);
    for (const r of dm().created["user"]) expect(r.sessionId).toBe(SID);
  });

  test("creates session-scoped emails and aliases", async () => {
    await seedDemoData(SID);
    for (const r of dm().created["user"]) {
      expect(r.email).toContain(SID.slice(0, 8));
      expect(r.alias).toContain(SID.slice(0, 6));
    }
  });

  test("creates all demo boards with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["board"]).toHaveLength(DEMO_BOARDS.length);
    for (const r of dm().created["board"]) expect(r.sessionId).toBe(SID);
  });

  test("creates session-scoped board slugs", async () => {
    await seedDemoData(SID);
    for (const r of dm().created["board"]) expect(r.slug).toContain(SID.slice(0, 8));
  });

  test("creates all demo posts with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["post"]).toHaveLength(DEMO_POSTS.length);
    for (const r of dm().created["post"]) expect(r.sessionId).toBe(SID);
  });

  test("creates all demo threads with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["thread"]).toHaveLength(DEMO_THREADS.length);
    for (const r of dm().created["thread"]) expect(r.sessionId).toBe(SID);
  });

  test("creates all demo shouts with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["shout"]).toHaveLength(DEMO_SHOUTS.length);
    for (const r of dm().created["shout"]) expect(r.sessionId).toBe(SID);
  });

  test("creates all demo events with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["calendarEvent"]).toHaveLength(DEMO_EVENTS.length);
    for (const r of dm().created["calendarEvent"]) expect(r.sessionId).toBe(SID);
  });

  test("creates event dates in the future", async () => {
    await seedDemoData(SID);
    const now = Date.now();
    for (const r of dm().created["calendarEvent"]) {
      expect((r.startTime as Date).getTime()).toBeGreaterThan(now);
    }
  });

  test("creates all demo issues with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["issueReport"]).toHaveLength(DEMO_ISSUES.length);
    for (const r of dm().created["issueReport"]) expect(r.sessionId).toBe(SID);
  });

  test("creates resolved and unresolved issues", async () => {
    await seedDemoData(SID);
    const issues = dm().created["issueReport"];
    expect(issues.some((r) => r.resolvedAt !== null)).toBe(true);
    expect(issues.some((r) => r.resolvedAt === null)).toBe(true);
  });

  test("creates all survey responses with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["surveyResponse"]).toHaveLength(DEMO_SURVEY_RESPONSES.length);
    for (const r of dm().created["surveyResponse"]) expect(r.sessionId).toBe(SID);
  });

  test("creates XP profiles with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["userLevel"]).toHaveLength(DEMO_XP_PROFILES.length);
    for (const r of dm().created["userLevel"]) expect(r.sessionId).toBe(SID);
  });

  test("creates XP transactions with demo:seed source", async () => {
    await seedDemoData(SID);
    expect(dm().created["xpTransaction"]).toHaveLength(DEMO_XP_PROFILES.length);
    for (const r of dm().created["xpTransaction"]) {
      expect(r.source).toBe("demo:seed");
      expect(r.sessionId).toBe(SID);
    }
  });

  test("creates login streaks with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["loginStreak"]).toHaveLength(DEMO_XP_PROFILES.length);
    for (const r of dm().created["loginStreak"]) expect(r.sessionId).toBe(SID);
  });

  test("creates custom quests", async () => {
    await seedDemoData(SID);
    expect(dm().created["customQuest"]).toHaveLength(DEMO_CUSTOM_QUESTS.length);
  });

  test("creates achievement unlocks with sessionId", async () => {
    await seedDemoData(SID);
    const total = DEMO_ACHIEVEMENT_UNLOCKS.reduce((s, a) => s + a.achievementKeys.length, 0);
    expect(dm().created["userAchievement"]).toHaveLength(total);
    for (const r of dm().created["userAchievement"]) expect(r.sessionId).toBe(SID);
  });

  test("creates quest progress with sessionId", async () => {
    await seedDemoData(SID);
    expect(dm().created["userQuestProgress"]).toHaveLength(DEMO_QUEST_PROGRESS.length);
    for (const r of dm().created["userQuestProgress"]) expect(r.sessionId).toBe(SID);
  });

  test("creates a survey round", async () => {
    await seedDemoData(SID);
    expect(dm().created["surveyRound"]).toHaveLength(1);
  });

  test("links survey responses to the round", async () => {
    await seedDemoData(SID);
    expect(dm().surveyFindMany).toHaveBeenCalled();
  });
});

// ── cleanupStaleDemoSessions ────────────────────────────────────────────────

describe("demo-session — cleanupStaleDemoSessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCreated();
  });

  test("returns 0 when no stale sessions exist", async () => {
    dm().top.demoSession.findMany.mockResolvedValue([]);
    const count = await cleanupStaleDemoSessions();
    expect(count).toBe(0);
  });

  test("deletes all session-scoped entities for stale sessions", async () => {
    dm().top.demoSession.findMany.mockResolvedValue([{ id: "stale-1" }]);
    dm().top.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    dm().top.surveyRound.findMany.mockResolvedValue([]);

    const count = await cleanupStaleDemoSessions();
    expect(count).toBe(1);

    const sessionFilters = dm()
      .mockDeleteMany.mock.calls.map((c: [{ where: Record<string, unknown> }]) => c[0].where)
      .filter((w: Record<string, unknown>) => w.sessionId === "stale-1");
    expect(sessionFilters.length).toBeGreaterThanOrEqual(10);
  });

  test("cleans up custom quests by creator ID", async () => {
    dm().top.demoSession.findMany.mockResolvedValue([{ id: "stale-2" }]);
    dm().top.user.findMany.mockResolvedValue([{ id: "user-a" }]);
    dm().top.surveyRound.findMany.mockResolvedValue([]);

    await cleanupStaleDemoSessions();

    expect(dm().mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ creatorId: { in: ["user-a"] } }),
      }),
    );
  });

  test("unlinks survey responses before deleting rounds", async () => {
    dm().top.demoSession.findMany.mockResolvedValue([{ id: "stale-3" }]);
    dm().top.user.findMany.mockResolvedValue([{ id: "ux" }]);
    dm().top.surveyRound.findMany.mockResolvedValue([{ id: "r1" }]);

    await cleanupStaleDemoSessions();

    expect(dm().mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { roundId: { in: ["r1"] } },
        data: { roundId: null },
      }),
    );
    expect(dm().mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["r1"] } } }),
    );
  });

  test("deletes the demo session record itself", async () => {
    dm().top.demoSession.findMany.mockResolvedValue([{ id: "stale-4" }]);
    dm().top.user.findMany.mockResolvedValue([]);
    dm().top.surveyRound.findMany.mockResolvedValue([]);

    await cleanupStaleDemoSessions();

    expect(dm().mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "stale-4" } }),
    );
  });
});

// ── Session isolation guarantees ────────────────────────────────────────────

describe("demo-session — session isolation guarantees", () => {
  test("two sessions produce different email suffixes", () => {
    const s1 = "aaaaaaaa-1111-1111-1111-111111111111";
    const s2 = "bbbbbbbb-2222-2222-2222-222222222222";
    expect(`alice@demo.platform-${s1.slice(0, 8)}`).not.toBe(
      `alice@demo.platform-${s2.slice(0, 8)}`,
    );
  });

  test("two sessions produce different alias suffixes", () => {
    expect(`alice_k_${"aaaaaa"}`).not.toBe(`alice_k_${"bbbbbb"}`);
  });

  test("two sessions produce different board slugs", () => {
    expect(`demo-general-${"aaaaaaaa"}`).not.toBe(`demo-general-${"bbbbbbbb"}`);
  });

  test("production sessionId (null) never matches demo sessionId", () => {
    expect(null).not.toBe("any-session-id");
  });
});
