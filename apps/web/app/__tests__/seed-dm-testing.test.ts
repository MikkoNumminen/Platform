const mockSurveyRoundAggregate = jest.fn();
const mockSurveyRoundCreate = jest.fn();
const mockUserFindMany = jest.fn();
const mockQuestCreateMany = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyRound: {
      aggregate: (...a: any[]) => mockSurveyRoundAggregate(...a),
      create: (...a: any[]) => mockSurveyRoundCreate(...a),
    },
    user: {
      findMany: (...a: any[]) => mockUserFindMany(...a),
    },
    quest: {
      createMany: (...a: any[]) => mockQuestCreateMany(...a),
    },
    auditLog: {
      create: (...a: any[]) => mockAuditLogCreate(...a),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/tenant", () => ({
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "vuohiliitto", sessionId: null }),
  getActiveTenant: jest.fn().mockResolvedValue("vuohiliitto"),
}));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue({ get: () => null }) }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { auth } from "@/auth";
import { seedDmTestingRound } from "@/lib/seed-dm-testing";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

const superuserSession = {
  user: {
    id: "superuser1",
    name: "Super User",
    alias: "SuperUser",
    role: "superuser",
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSurveyRoundAggregate.mockResolvedValue({ _max: { number: 0 } });
  mockSurveyRoundCreate.mockResolvedValue({ id: "round-1" });
  mockUserFindMany.mockResolvedValue([{ id: "user1" }, { id: "user2" }]);
  mockQuestCreateMany.mockResolvedValue({ count: 2 });
  mockAuditLogCreate.mockResolvedValue({});
});

describe("seedDmTestingRound", () => {
  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await seedDmTestingRound();
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
    expect(mockSurveyRoundCreate).not.toHaveBeenCalled();
  });

  test("returns error when not superuser", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "user" } } as any);
    const result = await seedDmTestingRound();
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
    expect(mockSurveyRoundCreate).not.toHaveBeenCalled();
  });

  test("returns error for admin role (superuser-only)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "admin" } } as any);
    const result = await seedDmTestingRound();
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
    expect(mockSurveyRoundCreate).not.toHaveBeenCalled();
  });

  test("creates survey round and quests for superuser", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);

    const result = await seedDmTestingRound();

    expect(result).toBeUndefined();

    // Survey round created with correct fields
    expect(mockSurveyRoundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        number: 1,
        title: "Private Messaging Feedback",
        xpReward: 20,
        creatorId: "superuser1",
      }),
    });
  });

  test("auto-increments round number from existing max", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);
    mockSurveyRoundAggregate.mockResolvedValue({ _max: { number: 5 } });

    await seedDmTestingRound();

    expect(mockSurveyRoundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ number: 6 }),
    });
  });

  test("creates survey completion quest for each active user", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);
    mockUserFindMany.mockResolvedValue([{ id: "user1" }, { id: "user2" }, { id: "user3" }]);

    await seedDmTestingRound();

    // First createMany call is the survey quest
    expect(mockQuestCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            surveyRoundId: "round-1",
            assigneeId: "user1",
            xpReward: 20,
          }),
        ]),
      }),
    );
    // 3 users × 1 survey quest + 3 DM quests = 4 createMany calls
    expect(mockQuestCreateMany).toHaveBeenCalledTimes(4);
  });

  test("creates three DM testing quests for each active user", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);
    mockUserFindMany.mockResolvedValue([{ id: "user1" }]);

    await seedDmTestingRound();

    // 1 survey quest + 3 DM quests
    expect(mockQuestCreateMany).toHaveBeenCalledTimes(4);

    // Verify DM quest names are present (unified Quest uses `name` field)
    const allCalls = mockQuestCreateMany.mock.calls.map((c) => c[0].data[0]?.name);
    expect(allCalls).toContain("Send your first private message");
    expect(allCalls).toContain("Start a conversation with someone new");
    expect(allCalls).toContain("Use the /w whisper command");
  });

  test("skips survey quest but still calls DM quest createMany when no active users", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);
    mockUserFindMany.mockResolvedValue([]);

    const result = await seedDmTestingRound();

    expect(result).toBeUndefined();
    expect(mockSurveyRoundCreate).toHaveBeenCalledTimes(1);
    // Survey quest is skipped (guarded by activeUsers.length > 0)
    // but the 3 DM quest loops still run (each with an empty data array)
    expect(mockQuestCreateMany).toHaveBeenCalledTimes(3);
    for (const call of mockQuestCreateMany.mock.calls) {
      expect(call[0].data).toHaveLength(0);
    }
  });

  test("queries only active non-pending non-demo users", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);

    await seedDmTestingRound();

    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: { role: { not: "pending" }, deletedAt: null, sessionId: null },
      select: { id: true },
    });
  });

  test("logs audit event after successful seed", async () => {
    mockAuth.mockResolvedValue(superuserSession as any);

    await seedDmTestingRound();

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "surveyRound.seedDmTesting",
        entityType: "SurveyRound",
        actorId: "superuser1",
      }),
    });
  });
});
