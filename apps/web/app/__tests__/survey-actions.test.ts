import { submitSurvey } from "@/lib/survey-actions";
import { CONVERSATION_STYLES, FEATURE_OPTIONS } from "@/lib/survey-config";

const mockCreate = jest.fn();
const mockAuth = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyResponse: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    surveyRound: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/gamification/trigger", () => ({
  triggerGamification: jest.fn().mockResolvedValue(undefined),
}));

const validData = {
  conversationStyle: CONVERSATION_STYLES[0],
  features: [FEATURE_OPTIONS[0]],
  mustHave: "Real-time chat",
  dealbreaker: "",
  otherFeedback: "",
};

describe("submitSurvey", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockAuth.mockClear();
    mockCreate.mockResolvedValue({ id: "test-id" });
    mockAuth.mockResolvedValue(null);
  });

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
      data: expect.objectContaining({
        dealbreaker: null,
        otherFeedback: null,
      }),
    });
  });

  test("fails with validation error for missing required fields", async () => {
    const result = await submitSurvey({ ...validData, conversationStyle: "" });
    expect(result).toEqual(expect.objectContaining({ code: "invalidInput" }));
    expect(result?.error).toBeDefined();
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
    mockAuth.mockResolvedValue(null);
    await submitSurvey(validData);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: null }),
    });
  });

  test("returns error when database fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockCreate.mockRejectedValue(new Error("DB error"));
    const result = await submitSurvey(validData);
    expect(result).toEqual({
      error: "An unexpected error occurred",
      code: "unexpectedError",
    });
    consoleSpy.mockRestore();
  });
});
