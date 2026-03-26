import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import Home from "../page";

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("../components/SurveyCTA", () => {
  return function MockSurveyCTA() {
    return <div data-testid="survey-cta">Survey CTA</div>;
  };
});

describe("Home", () => {
  test("renders the TopBar with title", () => {
    render(<Home />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Platform");
  });

  test("renders SurveyCTA", () => {
    render(<Home />);
    expect(screen.getByTestId("survey-cta")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<Home />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
