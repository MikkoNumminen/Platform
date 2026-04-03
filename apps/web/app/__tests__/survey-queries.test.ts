import { getSurveyResults } from "@/lib/survey-queries";

const mockCount = jest.fn();
const mockGroupBy = jest.fn();
const mockFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyResponse: {
      count: (...args: unknown[]) => mockCount(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
  DEMO_EMAIL: "demo@test.com",
  seedDemoData: jest.fn(),
  cleanupStaleDemoSessions: jest.fn(),
}));

describe("getSurveyResults", () => {
  beforeEach(() => {
    mockCount.mockClear();
    mockGroupBy.mockClear();
    mockFindMany.mockClear();
  });

  test("returns empty results when no responses", async () => {
    mockCount.mockResolvedValue(0);
    mockGroupBy.mockResolvedValue([]);
    // findMany is called for features, mustHave, and text responses
    mockFindMany.mockResolvedValue([]);

    const results = await getSurveyResults();

    expect(results.totalResponses).toBe(0);
    expect(results.conversationStyleCounts).toHaveLength(0);
    expect(results.featureCounts).toHaveLength(0);
    expect(results.mustHaveResponses).toHaveLength(0);
    expect(results.dealbreakerResponses).toHaveLength(0);
    expect(results.otherFeedbackResponses).toHaveLength(0);
  });

  test("uses count() for totalResponses", async () => {
    mockCount.mockResolvedValue(42);
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    const results = await getSurveyResults();

    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(results.totalResponses).toBe(42);
  });

  test("aggregates conversation style counts via groupBy", async () => {
    mockCount.mockResolvedValue(3);
    mockGroupBy.mockResolvedValue([
      { conversationStyle: "Both", _count: { conversationStyle: 2 } },
      {
        conversationStyle: "Forum posts (Reddit style — searchable, organized)",
        _count: { conversationStyle: 1 },
      },
    ]);
    mockFindMany.mockResolvedValue([]);

    const results = await getSurveyResults();

    expect(mockGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["conversationStyle"] }),
    );
    expect(results.conversationStyleCounts[0]).toEqual({ label: "Both", count: 2 });
    expect(results.conversationStyleCounts[1]).toEqual({
      label: "Forum posts (Reddit style — searchable, organized)",
      count: 1,
    });
  });

  test("aggregates feature counts in memory from features column only", async () => {
    mockCount.mockResolvedValue(2);
    mockGroupBy.mockResolvedValue([]);
    // findMany is called 3 times: features, mustHave rows, text rows
    mockFindMany
      .mockResolvedValueOnce([
        { features: ["Polls & voting", "Wiki / knowledge base"] },
        { features: ["Polls & voting"] },
      ])
      .mockResolvedValueOnce([]) // mustHave rows
      .mockResolvedValueOnce([]); // text rows

    const results = await getSurveyResults();

    // Verify the features query used select: { features: true }
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: { features: true } }),
    );
    expect(results.featureCounts[0]).toEqual({ label: "Polls & voting", count: 2 });
    expect(results.featureCounts[1]).toEqual({ label: "Wiki / knowledge base", count: 1 });
  });

  test("loads only mustHave and submittedAt for mustHaveResponses", async () => {
    const date = new Date("2024-01-01");
    mockCount.mockResolvedValue(1);
    mockGroupBy.mockResolvedValue([]);
    mockFindMany
      .mockResolvedValueOnce([]) // features
      .mockResolvedValueOnce([{ mustHave: "Chat", submittedAt: date }]) // mustHave rows
      .mockResolvedValueOnce([]); // text rows

    const results = await getSurveyResults();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: { mustHave: true, submittedAt: true } }),
    );
    expect(results.mustHaveResponses).toHaveLength(1);
    expect(results.mustHaveResponses[0]).toEqual({ text: "Chat", submittedAt: date });
  });

  test("filters out null dealbreaker and otherFeedback from targeted query", async () => {
    const date = new Date("2024-01-01");
    mockCount.mockResolvedValue(2);
    mockGroupBy.mockResolvedValue([]);
    mockFindMany
      .mockResolvedValueOnce([]) // features
      .mockResolvedValueOnce([]) // mustHave rows
      .mockResolvedValueOnce([
        { dealbreaker: "Ads", otherFeedback: null, submittedAt: date },
        { dealbreaker: null, otherFeedback: "More themes", submittedAt: date },
      ]); // text rows

    const results = await getSurveyResults();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { dealbreaker: true, otherFeedback: true, submittedAt: true },
      }),
    );
    expect(results.dealbreakerResponses).toHaveLength(1);
    expect(results.dealbreakerResponses[0].text).toBe("Ads");
    expect(results.otherFeedbackResponses).toHaveLength(1);
    expect(results.otherFeedbackResponses[0].text).toBe("More themes");
  });

  test("does not call groupBy or findMany when count returns 0", async () => {
    mockCount.mockResolvedValue(0);
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    await getSurveyResults();

    // groupBy and findMany are still called (they just return empty results)
    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(mockGroupBy).toHaveBeenCalledTimes(1);
  });
});
