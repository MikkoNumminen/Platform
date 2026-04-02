/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tests for query files: setting-queries, audit-queries, survey-round-queries
 */

const mockPlatformSettingFindUnique = jest.fn();
const mockAuditLogFindMany = jest.fn();
const mockAuditLogCount = jest.fn();
const mockSurveyRoundFindMany = jest.fn();
const mockSurveyRoundFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    platformSetting: {
      findUnique: (...a: any[]) => mockPlatformSettingFindUnique(...a),
    },
    auditLog: {
      findMany: (...a: any[]) => mockAuditLogFindMany(...a),
      count: (...a: any[]) => mockAuditLogCount(...a),
    },
    surveyRound: {
      findMany: (...a: any[]) => mockSurveyRoundFindMany(...a),
      findFirst: (...a: any[]) => mockSurveyRoundFindFirst(...a),
    },
  },
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));

import { getMotd } from "@/lib/setting-queries";
import { getAuditLogs, getAuditActionTypes } from "@/lib/audit-queries";
import { getAllSurveyRounds, getActiveSurveyRound } from "@/lib/survey-round-queries";

beforeEach(() => jest.clearAllMocks());

describe("setting-queries", () => {
  test("getMotd returns stored MOTD", async () => {
    mockPlatformSettingFindUnique.mockResolvedValue({ key: "motd", value: "Hello world" });
    expect(await getMotd()).toBe("Hello world");
  });

  test("getMotd returns default when not set", async () => {
    mockPlatformSettingFindUnique.mockResolvedValue(null);
    expect(await getMotd()).toBe("Welcome. Type /help for commands.");
  });
});

describe("audit-queries", () => {
  test("getAuditLogs returns paginated logs", async () => {
    const logs = [{ id: "log-1", action: "test", entityType: "Test", createdAt: new Date() }];
    mockAuditLogFindMany.mockResolvedValue(logs);
    mockAuditLogCount.mockResolvedValue(1);

    const result = await getAuditLogs({ page: 0, pageSize: 10 });
    expect(result.logs).toEqual(logs);
    expect(result.total).toBe(1);
  });

  test("getAuditLogs filters by action", async () => {
    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCount.mockResolvedValue(0);

    await getAuditLogs({ page: 0, pageSize: 10, action: "user.create" });
    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: "user.create" }),
      }),
    );
  });

  test("getAuditLogs filters by search", async () => {
    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCount.mockResolvedValue(0);

    await getAuditLogs({ page: 0, pageSize: 10, search: "admin" });
    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });

  test("getAuditActionTypes returns distinct actions", async () => {
    mockAuditLogFindMany.mockResolvedValue([{ action: "user.create" }, { action: "user.delete" }]);

    const result = await getAuditActionTypes();
    expect(result).toEqual(["user.create", "user.delete"]);
  });
});

describe("survey-round-queries", () => {
  const mockRound = {
    id: "r1",
    number: 1,
    title: "Survey 1",
    description: null,
    status: "active",
    xpReward: 50,
    customQuestions: null,
    deadline: null,
    closedAt: null,
    createdAt: new Date(),
    _count: { responses: 5 },
    creator: { alias: "Admin", name: "Admin User" },
  };

  test("getAllSurveyRounds returns formatted rounds", async () => {
    mockSurveyRoundFindMany.mockResolvedValue([mockRound]);

    const result = await getAllSurveyRounds();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Survey 1");
    expect(result[0].responseCount).toBe(5);
    expect(result[0].creatorName).toBe("Admin");
  });

  test("getAllSurveyRounds falls back to name when no alias", async () => {
    mockSurveyRoundFindMany.mockResolvedValue([
      { ...mockRound, creator: { alias: null, name: "Bob" } },
    ]);

    const result = await getAllSurveyRounds();
    expect(result[0].creatorName).toBe("Bob");
  });

  test("getActiveSurveyRound returns active round", async () => {
    mockSurveyRoundFindFirst.mockResolvedValue(mockRound);

    const result = await getActiveSurveyRound();
    expect(result?.title).toBe("Survey 1");
  });

  test("getActiveSurveyRound returns null when no active round", async () => {
    mockSurveyRoundFindFirst.mockResolvedValue(null);

    const result = await getActiveSurveyRound();
    expect(result).toBeNull();
  });
});
