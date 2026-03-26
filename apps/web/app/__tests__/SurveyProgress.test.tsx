import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import SurveyProgress from "../components/survey/SurveyProgress";

describe("SurveyProgress", () => {
  test("displays correct question number", () => {
    render(<SurveyProgress currentStep={2} totalSteps={5} />);
    expect(screen.getByText("Question 3 of 5")).toBeInTheDocument();
  });

  test("renders progress bar", () => {
    render(<SurveyProgress currentStep={0} totalSteps={5} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("progress bar has correct value", () => {
    render(<SurveyProgress currentStep={2} totalSteps={5} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "60");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SurveyProgress currentStep={0} totalSteps={5} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
