import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

const mockAuth = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

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

jest.mock("../components/WelcomeHero", () => {
  return function MockWelcomeHero() {
    return <div data-testid="welcome-hero">Welcome Hero</div>;
  };
});

jest.mock("@/lib/shout-queries", () => ({
  getRecentShouts: jest.fn().mockResolvedValue([]),
}));

const mockGetSurveyStatus = jest.fn();
jest.mock("@/lib/survey-user-queries", () => ({
  getUserSurveyStatus: (...args: unknown[]) => mockGetSurveyStatus(...args),
}));

jest.mock("@/lib/custom-quest-queries", () => ({
  getMyCustomQuests: jest.fn().mockResolvedValue([]),
}));

jest.mock("../components/QuestReceivedCelebration", () => {
  return function MockQuestCelebration() {
    return null;
  };
});

jest.mock("../components/DemoWelcomeOverlay", () => {
  return function MockDemoWelcomeOverlay() {
    return null;
  };
});

import Home from "../page";

describe("Home", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "u1", alias: "Test" } });
      mockGetSurveyStatus.mockResolvedValue({ u1: false });
    });

    test("renders the TopBar with title", async () => {
      render(await Home());
      expect(screen.getByTestId("topbar")).toHaveTextContent("Platform");
    });

    test("renders Shoutbox", async () => {
      render(await Home());
      expect(screen.getByTestId("shoutbox")).toBeInTheDocument();
    });

    test("renders SurveyCTA when survey not completed", async () => {
      render(await Home());
      expect(screen.getByTestId("survey-cta")).toBeInTheDocument();
    });

    test("hides SurveyCTA when survey completed", async () => {
      mockGetSurveyStatus.mockResolvedValue({ u1: true });
      render(await Home());
      expect(screen.queryByTestId("survey-cta")).not.toBeInTheDocument();
    });
  });

  describe("unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    test("renders WelcomeHero", async () => {
      render(await Home());
      expect(screen.getByTestId("welcome-hero")).toBeInTheDocument();
    });

    test("does not render Shoutbox", async () => {
      render(await Home());
      expect(screen.queryByTestId("shoutbox")).not.toBeInTheDocument();
    });

    test("does not render SurveyCTA", async () => {
      render(await Home());
      expect(screen.queryByTestId("survey-cta")).not.toBeInTheDocument();
    });
  });

  test("has no accessibility violations", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockGetSurveyStatus.mockResolvedValue({ u1: false });
    const { container } = render(await Home());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
