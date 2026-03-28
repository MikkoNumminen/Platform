import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import SurveyForm from "../components/survey/SurveyForm";

jest.mock("@/app/components/TutorialProvider", () => ({
  emitTutorialEvent: jest.fn(),
}));

jest.mock("@/lib/survey-actions", () => ({
  submitSurvey: jest.fn().mockResolvedValue(undefined),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("SurveyForm", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test("renders the first question (conversation style)", () => {
    render(<SurveyForm />);
    expect(screen.getByText("What conversation style do you prefer?")).toBeInTheDocument();
  });

  test("renders progress indicator", () => {
    render(<SurveyForm />);
    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
  });

  test("shows Back and Next buttons", () => {
    render(<SurveyForm />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  test("Back button is disabled on first step", () => {
    render(<SurveyForm />);
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  test("shows validation error when advancing without selection", async () => {
    const user = userEvent.setup();
    render(<SurveyForm />);
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Please select a conversation style")).toBeInTheDocument();
  });

  test("advances to step 2 after selecting an option", async () => {
    const user = userEvent.setup();
    render(<SurveyForm />);
    await user.click(screen.getByLabelText("Real-time threads (Slack/Discord style)"));
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
  });

  test("can navigate back to previous step", async () => {
    const user = userEvent.setup();
    render(<SurveyForm />);
    await user.click(screen.getByLabelText("Real-time threads (Slack/Discord style)"));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
  });

  test("shows thank-you screen when already submitted", () => {
    localStorageMock.setItem("platform_survey_submitted", "true");
    render(<SurveyForm />);
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SurveyForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
