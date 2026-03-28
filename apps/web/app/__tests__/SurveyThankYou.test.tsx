import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import SurveyThankYou from "../components/survey/SurveyThankYou";

const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

describe("SurveyThankYou", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: { user: { role: "user" } } });
  });

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

  test("renders back to home link for approved users", () => {
    render(<SurveyThankYou />);
    const link = screen.getByRole("link", { name: /back to home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  test("shows pending approval message for pending users", () => {
    mockUseSession.mockReturnValue({ data: { user: { role: "pending" } } });
    render(<SurveyThankYou />);
    expect(screen.getByText("Waiting for approval")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back to home/i })).not.toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SurveyThankYou />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
