import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import TextResponseList from "../components/survey/TextResponseList";

describe("TextResponseList", () => {
  test("renders the title with count", () => {
    render(<TextResponseList title="Feedback" responses={[]} />);
    expect(screen.getByText("Feedback (0)")).toBeInTheDocument();
  });

  test("shows no responses message when empty", () => {
    render(<TextResponseList title="Feedback" responses={[]} />);
    expect(screen.getByText("No responses yet")).toBeInTheDocument();
  });

  test("renders response text", () => {
    const responses = [
      { text: "Great idea!", submittedAt: new Date("2026-03-20") },
      { text: "Need more features", submittedAt: new Date("2026-03-21") },
    ];
    render(<TextResponseList title="Feedback" responses={responses} />);
    expect(screen.getByText("Great idea!")).toBeInTheDocument();
    expect(screen.getByText("Need more features")).toBeInTheDocument();
  });

  test("shows correct count in title", () => {
    const responses = [
      { text: "Response 1", submittedAt: new Date() },
      { text: "Response 2", submittedAt: new Date() },
    ];
    render(<TextResponseList title="Feedback" responses={responses} />);
    expect(screen.getByText("Feedback (2)")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const responses = [{ text: "Great idea!", submittedAt: new Date("2026-03-20") }];
    const { container } = render(<TextResponseList title="Feedback" responses={responses} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
