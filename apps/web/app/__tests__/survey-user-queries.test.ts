import { getUserSurveyStatus } from "@/lib/survey-user-queries";

const mockFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyResponse: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
}));

describe("getUserSurveyStatus", () => {
  beforeEach(() => {
    mockFindMany.mockClear();
  });

  test("returns empty object for empty user list", async () => {
    const result = await getUserSurveyStatus([]);
    expect(result).toEqual({});
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("returns true for users who completed the survey", async () => {
    mockFindMany.mockResolvedValue([{ userId: "user-1" }]);
    const result = await getUserSurveyStatus(["user-1", "user-2"]);
    expect(result).toEqual({ "user-1": true, "user-2": false });
  });

  test("returns false for users who have not completed the survey", async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await getUserSurveyStatus(["user-1"]);
    expect(result).toEqual({ "user-1": false });
  });

  test("queries with correct parameters", async () => {
    mockFindMany.mockResolvedValue([]);
    await getUserSurveyStatus(["user-1", "user-2"]);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: { in: ["user-1", "user-2"] } },
      select: { userId: true },
      distinct: ["userId"],
    });
  });
});
