import {
  validateCustomAnswers,
  DM_TESTING_QUESTIONS,
  type CustomQuestion,
} from "@/lib/custom-survey-config";

describe("validateCustomAnswers", () => {
  const questions: CustomQuestion[] = [
    { id: "q1", text: "Pick one", type: "single", options: ["A", "B"], required: true },
    { id: "q2", text: "Pick many", type: "multi", options: ["X", "Y"], required: true },
    { id: "q3", text: "Write something", type: "text", required: false },
  ];

  test("returns null when all required answers are provided", () => {
    const result = validateCustomAnswers(questions, { q1: "A", q2: ["X"] });
    expect(result).toBeNull();
  });

  test("returns error for missing required single select", () => {
    const result = validateCustomAnswers(questions, { q2: ["X"] });
    expect(result).toContain("Pick one");
  });

  test("returns error for missing required multi select", () => {
    const result = validateCustomAnswers(questions, { q1: "A", q2: [] });
    expect(result).toContain("Pick many");
  });

  test("allows empty optional text field", () => {
    const result = validateCustomAnswers(questions, { q1: "A", q2: ["X"], q3: "" });
    expect(result).toBeNull();
  });

  test("returns error for required text field when empty", () => {
    const requiredText: CustomQuestion[] = [
      { id: "t1", text: "Required text", type: "text", required: true },
    ];
    const result = validateCustomAnswers(requiredText, { t1: "" });
    expect(result).toContain("Required text");
  });
});

describe("DM_TESTING_QUESTIONS", () => {
  test("has 6 questions", () => {
    expect(DM_TESTING_QUESTIONS).toHaveLength(6);
  });

  test("all questions have id, text, and type", () => {
    for (const q of DM_TESTING_QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(["single", "multi", "text"]).toContain(q.type);
    }
  });

  test("single/multi questions have options", () => {
    for (const q of DM_TESTING_QUESTIONS) {
      if (q.type !== "text") {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThan(0);
      }
    }
  });

  test("only the last question (bugs) is a text type", () => {
    const textQuestions = DM_TESTING_QUESTIONS.filter((q) => q.type === "text");
    expect(textQuestions).toHaveLength(1);
    expect(textQuestions[0].id).toBe("dm_bugs");
    expect(textQuestions[0].required).toBe(false);
  });
});
