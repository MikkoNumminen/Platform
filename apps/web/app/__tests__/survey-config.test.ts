import {
  validateSurveyData,
  CONVERSATION_STYLES,
  FEATURE_OPTIONS,
  LOCALSTORAGE_KEY,
  type SurveyData,
} from "@/lib/survey-config";

const validData: SurveyData = {
  conversationStyle: CONVERSATION_STYLES[0],
  features: [FEATURE_OPTIONS[0], FEATURE_OPTIONS[1]],
  mustHave: "Real-time chat",
  dealbreaker: "",
  otherFeedback: "",
};

describe("survey-config", () => {
  describe("validateSurveyData", () => {
    test("passes with valid data", () => {
      const result = validateSurveyData(validData);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test("fails when conversationStyle is empty", () => {
      const result = validateSurveyData({ ...validData, conversationStyle: "" });
      expect(result.valid).toBe(false);
      expect(result.errors.conversationStyle).toBeDefined();
    });

    test("fails when conversationStyle is invalid", () => {
      const result = validateSurveyData({
        ...validData,
        conversationStyle: "invalid option",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.conversationStyle).toBe("Invalid selection");
    });

    test("fails when features is empty", () => {
      const result = validateSurveyData({ ...validData, features: [] });
      expect(result.valid).toBe(false);
      expect(result.errors.features).toBeDefined();
    });

    test("fails when features contains invalid option", () => {
      const result = validateSurveyData({
        ...validData,
        features: ["invalid feature"],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.features).toBe("Invalid feature selection");
    });

    test("fails when mustHave is empty", () => {
      const result = validateSurveyData({ ...validData, mustHave: "" });
      expect(result.valid).toBe(false);
      expect(result.errors.mustHave).toBeDefined();
    });

    test("fails when mustHave is only whitespace", () => {
      const result = validateSurveyData({ ...validData, mustHave: "   " });
      expect(result.valid).toBe(false);
      expect(result.errors.mustHave).toBeDefined();
    });

    test("fails when mustHave exceeds 200 characters", () => {
      const result = validateSurveyData({
        ...validData,
        mustHave: "a".repeat(201),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.mustHave).toBe("Maximum 200 characters");
    });

    test("fails when dealbreaker exceeds 200 characters", () => {
      const result = validateSurveyData({
        ...validData,
        dealbreaker: "a".repeat(201),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.dealbreaker).toBe("Maximum 200 characters");
    });

    test("fails when otherFeedback exceeds 500 characters", () => {
      const result = validateSurveyData({
        ...validData,
        otherFeedback: "a".repeat(501),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.otherFeedback).toBe("Maximum 500 characters");
    });

    test("passes with optional fields empty", () => {
      const result = validateSurveyData({
        ...validData,
        dealbreaker: "",
        otherFeedback: "",
      });
      expect(result.valid).toBe(true);
    });
  });

  test("LOCALSTORAGE_KEY is defined", () => {
    expect(LOCALSTORAGE_KEY).toBe("platform_survey_submitted");
  });

  test("CONVERSATION_STYLES has 3 options", () => {
    expect(CONVERSATION_STYLES).toHaveLength(3);
  });

  test("FEATURE_OPTIONS has 7 options", () => {
    expect(FEATURE_OPTIONS).toHaveLength(7);
  });
});
