/* eslint-disable @typescript-eslint/no-explicit-any */

import { CONVERSATION_STYLES, FEATURE_OPTIONS } from "@/lib/survey-config";

const mockCreate = jest.fn();
const mockAuth = jest.fn();
const mockUserUpdate = jest.fn();
const mockCustomQuestFindFirst = jest.fn();
const mockCustomQuestUpdate = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyResponse: {
      create: (...args: any[]) => mockCreate(...args),
    },
    user: {
      update: (...args: any[]) => mockUserUpdate(...args),
    },
    customQuest: {
      findFirst: (...args: any[]) => mockCustomQuestFindFirst(...args),
      update: (...args: any[]) => mockCustomQuestUpdate(...args),
    },
  },
}));

jest.mock("@/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/rateLimit", () => ({ rateLimit: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/lib/demo-session", () => ({ getDemoSessionId: jest.fn().mockResolvedValue(null) }));
jest.mock("@/lib/gamification/xp-service", () => ({
  awardCustomXp: jest.fn().mockResolvedValue(null),
}));

import { submitSurvey, submitCustomSurvey } from "@/lib/survey-actions";
import { awardCustomXp } from "@/lib/gamification/xp-service";

const validData = {
  conversationStyle: CONVERSATION_STYLES[0],
  features: [FEATURE_OPTIONS[0]],
  mustHave: "Real-time chat",
  dealbreaker: "",
  otherFeedback: "",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({ id: "test-id" });
  mockAuth.mockResolvedValue(null);
});

describe("submitSurvey", () => {
  test("succeeds with valid data", async () => {
    const result = await submitSurvey(validData);
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("trims text fields before saving", async () => {
    await submitSurvey({
      ...validData,
      mustHave: "  Real-time chat  ",
      dealbreaker: "  Ads  ",
      otherFeedback: "  None  ",
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mustHave: "Real-time chat",
        dealbreaker: "Ads",
        otherFeedback: "None",
      }),
    });
  });

  test("saves null for empty optional fields", async () => {
    await submitSurvey(validData);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ dealbreaker: null, otherFeedback: null }),
    });
  });

  test("fails with validation error for missing required fields", async () => {
    const result = await submitSurvey({ ...validData, conversationStyle: "" });
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("stores userId when user is logged in", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    await submitSurvey(validData);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-123" }),
    });
  });

  test("stores null userId when not logged in", async () => {
    await submitSurvey(validData);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: null }),
    });
  });

  test("updates development skills when logged in", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockUserUpdate.mockResolvedValue({});
    await submitSurvey({ ...validData, developmentSkills: ["Coding (frontend)"] });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({
        wantsToDevelop: true,
        developmentSkills: ["Coding (frontend)"],
      }),
    });
  });

  test("completes survey quest when roundId provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockUserUpdate.mockResolvedValue({});
    mockCustomQuestFindFirst.mockResolvedValue({ id: "q1", xpReward: 100 });
    mockCustomQuestUpdate.mockResolvedValue({});

    await submitSurvey(validData, "round-1");
    expect(mockCustomQuestFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ surveyRoundId: "round-1", assigneeId: "u1" }),
      }),
    );
    expect(mockCustomQuestUpdate).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: expect.objectContaining({ status: "completed" }),
    });
    expect(awardCustomXp).toHaveBeenCalledWith("u1", 100, "custom_quest:complete", "q1");
  });

  test("returns error when database fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockCreate.mockRejectedValue(new Error("DB error"));
    const result = await submitSurvey(validData);
    expect(result).toEqual({ error: "An unexpected error occurred", code: "unexpectedError" });
    consoleSpy.mockRestore();
  });
});

describe("submitCustomSurvey", () => {
  test("returns error when roundId is empty", async () => {
    const result = await submitCustomSurvey({ q1: "answer" }, "");
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
  });

  test("creates response with custom answers", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockCustomQuestFindFirst.mockResolvedValue(null);

    const result = await submitCustomSurvey({ q1: "answer1", q2: ["a", "b"] }, "round-1");
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conversationStyle: "custom",
        features: [],
        mustHave: "custom",
        customAnswers: { q1: "answer1", q2: ["a", "b"] },
        roundId: "round-1",
      }),
    });
  });

  test("completes survey quest for custom survey", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockCustomQuestFindFirst.mockResolvedValue({ id: "q1", xpReward: 50 });
    mockCustomQuestUpdate.mockResolvedValue({});

    await submitCustomSurvey({ q1: "answer" }, "round-1");
    expect(mockCustomQuestUpdate).toHaveBeenCalled();
    expect(awardCustomXp).toHaveBeenCalledWith("u1", 50, "custom_quest:complete", "q1");
  });

  test("works for anonymous user", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await submitCustomSurvey({ q1: "answer" }, "round-1");
    expect(result).toBeUndefined();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: null }),
    });
  });
});
