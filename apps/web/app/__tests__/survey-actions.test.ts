import { submitSurvey } from "@/lib/survey-actions";
import { CONVERSATION_STYLES, FEATURE_OPTIONS } from "@/lib/survey-config";

const mockCreate = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    surveyResponse: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
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
    mockCreate.mockResolvedValue({ id: "test-id" });
  });

  test("succeeds with valid data", async () => {
    const result = await submitSurvey(validData);
    expect(result.success).toBe(true);
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
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("returns error when database fails", async () => {
    mockCreate.mockRejectedValue(new Error("DB error"));
    const result = await submitSurvey(validData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});
