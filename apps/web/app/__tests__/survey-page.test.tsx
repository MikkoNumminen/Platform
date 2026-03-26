import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import SurveyPage from "../survey/page";

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("../components/survey/SurveyForm", () => {
  return function MockSurveyForm() {
    return <div data-testid="survey-form">Survey Form</div>;
  };
});

describe("SurveyPage", () => {
  test("renders TopBar with correct title", () => {
    render(<SurveyPage />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Community Survey");
  });

  test("renders SurveyForm", () => {
    render(<SurveyPage />);
    expect(screen.getByTestId("survey-form")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SurveyPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
