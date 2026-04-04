const mockSurveyRoundCreate = jest.fn();
const mockSurveyRoundAggregate = jest.fn();
const mockSurveyRoundFindFirst = jest.fn();
const mockSurveyRoundUpdate = jest.fn();
const mockUserFindMany = jest.fn();
const mockQuestCreateMany = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyRound: {
      create: (...a: any[]) => mockSurveyRoundCreate(...a),
      aggregate: (...a: any[]) => mockSurveyRoundAggregate(...a),
      findFirst: (...a: any[]) => mockSurveyRoundFindFirst(...a),
      update: (...a: any[]) => mockSurveyRoundUpdate(...a),
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
jest.mock("@/lib/rateLimit", () => ({ rateLimit: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/lib/demo-session", () => ({ getDemoSessionId: jest.fn().mockResolvedValue(null) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue({ get: () => null }) }));

jest.mock("@/lib/survey-queries", () => ({
  getSurveyResults: jest.fn().mockResolvedValue({
    totalResponses: 0,
    conversationStyleCounts: [],
    featureCounts: [],
    mustHaveResponses: [],
    dealbreakerResponses: [],
    otherFeedbackResponses: [],
    customResults: null,
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@/lib/guardedAction", () => require("./helpers/mock-guarded-action"));

import { auth } from "@/auth";
import { createSurveyRound, closeSurveyRound, fetchRoundResults } from "@/lib/survey-round-actions";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

const adminSession = {
  user: { id: "admin1", alias: "Admin", name: "Admin", permissions: { "survey:results": true } },
};

beforeEach(() => jest.clearAllMocks());

describe("createSurveyRound", () => {
  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await createSurveyRound("Round 1");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error without survey:results permission", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } } as any);
    const result = await createSurveyRound("Round 1");
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error for empty title", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    const result = await createSurveyRound("   ");
    expect(result).toEqual(expect.objectContaining({ code: "roundTitleRequired" }));
  });

  test("creates round with auto-incremented number", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    mockSurveyRoundAggregate.mockResolvedValue({ _max: { number: 3 } });
    mockSurveyRoundCreate.mockResolvedValue({ id: "round-1" });
    mockAuditLogCreate.mockResolvedValue({});

    const result = await createSurveyRound("Feedback Round");
    expect(result).toBeUndefined();
    expect(mockSurveyRoundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ number: 4, title: "Feedback Round" }),
    });
  });

  test("creates custom quests when xpReward > 0", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    mockSurveyRoundAggregate.mockResolvedValue({ _max: { number: 0 } });
    mockSurveyRoundCreate.mockResolvedValue({ id: "round-1" });
    mockUserFindMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    mockQuestCreateMany.mockResolvedValue({ count: 2 });
    mockAuditLogCreate.mockResolvedValue({});

    const result = await createSurveyRound("Survey", undefined, 100);
    expect(result).toBeUndefined();
    expect(mockQuestCreateMany).toHaveBeenCalled();
  });

  test("clamps xpReward to 0-10000", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    mockSurveyRoundAggregate.mockResolvedValue({ _max: { number: 0 } });
    mockSurveyRoundCreate.mockResolvedValue({ id: "round-1" });
    mockAuditLogCreate.mockResolvedValue({});

    await createSurveyRound("Survey", undefined, 99999);
    expect(mockSurveyRoundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ xpReward: 10000 }),
    });
  });
});

describe("closeSurveyRound", () => {
  const validId = "00000000-0000-0000-0000-000000000001";

  test("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await closeSurveyRound(validId);
    expect(result).toEqual(expect.objectContaining({ code: "permissionDenied" }));
  });

  test("returns error for invalid UUID", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    const result = await closeSurveyRound("not-a-uuid");
    expect(result).toEqual(expect.objectContaining({ code: "invalidId" }));
  });

  test("returns error when round not found", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    mockSurveyRoundFindFirst.mockResolvedValue(null);
    const result = await closeSurveyRound(validId);
    expect(result).toEqual(expect.objectContaining({ code: "roundNotFound" }));
  });

  test("closes active round", async () => {
    mockAuth.mockResolvedValue(adminSession as any);
    mockSurveyRoundFindFirst.mockResolvedValue({ id: validId, title: "R1", number: 1 });
    mockSurveyRoundUpdate.mockResolvedValue({});
    mockAuditLogCreate.mockResolvedValue({});

    const result = await closeSurveyRound(validId);
    expect(result).toBeUndefined();
    expect(mockSurveyRoundUpdate).toHaveBeenCalledWith({
      where: { id: validId },
      data: expect.objectContaining({ status: "closed" }),
    });
  });
});

describe("fetchRoundResults", () => {
  test("delegates to getSurveyResults", async () => {
    // fetchRoundResults is a thin wrapper — just verify it doesn't throw
    const result = await fetchRoundResults(null);
    expect(result).toBeDefined();
  });
});
