import { getSurveyResults } from "@/lib/survey-queries";

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
  DEMO_EMAIL: "demo@test.com",
  seedDemoData: jest.fn(),
  cleanupStaleDemoSessions: jest.fn(),
}));

describe("getSurveyResults", () => {
  beforeEach(() => {
    mockFindMany.mockClear();
  });

  test("returns empty results when no responses", async () => {
    mockFindMany.mockResolvedValue([]);
    const results = await getSurveyResults();
    expect(results.totalResponses).toBe(0);
    expect(results.conversationStyleCounts).toHaveLength(0);
    expect(results.featureCounts).toHaveLength(0);
    expect(results.mustHaveResponses).toHaveLength(0);
    expect(results.dealbreakerResponses).toHaveLength(0);
    expect(results.otherFeedbackResponses).toHaveLength(0);
  });

  test("aggregates conversation style counts", async () => {
    mockFindMany.mockResolvedValue([
      {
        conversationStyle: "Both",
        features: [],
        mustHave: "Chat",
        dealbreaker: null,
        otherFeedback: null,
        submittedAt: new Date(),
      },
      {
        conversationStyle: "Both",
        features: [],
        mustHave: "Forum",
        dealbreaker: null,
        otherFeedback: null,
        submittedAt: new Date(),
      },
      {
        conversationStyle: "Forum posts (Reddit style — searchable, organized)",
        features: [],
        mustHave: "Search",
        dealbreaker: null,
        otherFeedback: null,
        submittedAt: new Date(),
      },
    ]);

    const results = await getSurveyResults();
    expect(results.totalResponses).toBe(3);
    expect(results.conversationStyleCounts[0]).toEqual({
      label: "Both",
      count: 2,
    });
  });

  test("aggregates feature counts sorted by popularity", async () => {
    mockFindMany.mockResolvedValue([
      {
        conversationStyle: "Both",
        features: ["Polls & voting", "Wiki / knowledge base"],
        mustHave: "A",
        dealbreaker: null,
        otherFeedback: null,
        submittedAt: new Date(),
      },
      {
        conversationStyle: "Both",
        features: ["Polls & voting"],
        mustHave: "B",
        dealbreaker: null,
        otherFeedback: null,
        submittedAt: new Date(),
      },
    ]);

    const results = await getSurveyResults();
    expect(results.featureCounts[0]).toEqual({
      label: "Polls & voting",
      count: 2,
    });
    expect(results.featureCounts[1]).toEqual({
      label: "Wiki / knowledge base",
      count: 1,
    });
  });

  test("filters out null dealbreaker and otherFeedback", async () => {
    mockFindMany.mockResolvedValue([
      {
        conversationStyle: "Both",
        features: [],
        mustHave: "Chat",
        dealbreaker: "Ads",
        otherFeedback: null,
        submittedAt: new Date(),
      },
      {
        conversationStyle: "Both",
        features: [],
        mustHave: "Forum",
        dealbreaker: null,
        otherFeedback: "More themes",
        submittedAt: new Date(),
      },
    ]);

    const results = await getSurveyResults();
    expect(results.mustHaveResponses).toHaveLength(2);
    expect(results.dealbreakerResponses).toHaveLength(1);
    expect(results.dealbreakerResponses[0].text).toBe("Ads");
    expect(results.otherFeedbackResponses).toHaveLength(1);
    expect(results.otherFeedbackResponses[0].text).toBe("More themes");
  });
});
