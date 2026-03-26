import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import SurveyThankYou from "../components/survey/SurveyThankYou";

describe("SurveyThankYou", () => {
  test("renders thank you message", () => {
    render(<SurveyThankYou />);
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
  });

  test("renders feedback message", () => {
    render(<SurveyThankYou />);
    expect(
      screen.getByText("Your feedback will help us build something great."),
    ).toBeInTheDocument();
  });

  test("renders back to home link", () => {
    render(<SurveyThankYou />);
    const link = screen.getByRole("link", { name: /back to home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SurveyThankYou />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
