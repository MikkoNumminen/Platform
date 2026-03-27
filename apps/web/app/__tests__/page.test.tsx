import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

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

jest.mock("../components/Shoutbox", () => {
  return function MockShoutbox() {
    return <div data-testid="shoutbox">Shoutbox</div>;
  };
});

jest.mock("@/lib/shout-queries", () => ({
  getRecentShouts: jest.fn().mockResolvedValue([]),
}));

import Home from "../page";

describe("Home", () => {
  test("renders the TopBar with title", async () => {
    render(await Home());
    expect(screen.getByTestId("topbar")).toHaveTextContent("Platform");
  });

  test("renders Shoutbox", async () => {
    render(await Home());
    expect(screen.getByTestId("shoutbox")).toBeInTheDocument();
  });

  test("renders SurveyCTA", async () => {
    render(await Home());
    expect(screen.getByTestId("survey-cta")).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(await Home());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
