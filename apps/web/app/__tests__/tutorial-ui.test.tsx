import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion the same way as gamification-ui.test.tsx
jest.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(function MotionDiv(
        props: Record<string, unknown>,
        ref: React.Ref<HTMLDivElement>,
      ) {
        const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
        return React.createElement("div", { ...rest, ref });
      }),
      p: React.forwardRef(function MotionP(
        props: Record<string, unknown>,
        ref: React.Ref<HTMLParagraphElement>,
      ) {
        const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
        return React.createElement("p", { ...rest, ref });
      }),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

// Mock TutorialProvider's useTutorialMaybe hook
const mockContextValue = jest.fn();
jest.mock("../components/TutorialProvider", () => ({
  useTutorialMaybe: () => mockContextValue(),
}));

// Mock tutorial-config for TIER_NAMES used in TutorialChecklist
jest.mock("@/lib/tutorial/tutorial-config", () => ({
  TIER_NAMES: {
    1: "Getting Started",
    2: "Community Explorer",
    3: "Admin Basics",
    4: "Team Leader",
  },
}));

import TutorialChecklist from "../components/TutorialChecklist";
import TutorialCelebration from "../components/TutorialCelebration";

function makeTutorialStep(id: string, tier: number) {
  return {
    id,
    route: "/",
    targetSelector: `[data-tutorial="${id}"]`,
    tier,
    xpReward: 10,
  };
}

const baseSteps = [
  makeTutorialStep("set_alias", 1),
  makeTutorialStep("complete_survey", 1),
  makeTutorialStep("report_issue", 1),
  makeTutorialStep("explore_home", 2),
  makeTutorialStep("browse_boards", 2),
];

describe("TutorialChecklist", () => {
  test("renders nothing when tutorial is not active", () => {
    mockContextValue.mockReturnValue({
      isActive: false,
      allComplete: false,
      steps: baseSteps,
      completedSteps: new Set(),
      currentStep: baseSteps[0],
      totalSteps: 5,
      completedCount: 0,
    });

    const { container } = render(<TutorialChecklist />);
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when all steps are complete", () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      allComplete: true,
      steps: baseSteps,
      completedSteps: new Set(baseSteps.map((s) => s.id)),
      currentStep: null,
      totalSteps: 5,
      completedCount: 5,
    });

    const { container } = render(<TutorialChecklist />);
    expect(container.innerHTML).toBe("");
  });

  test('shows "Guided Tour" header', () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      allComplete: false,
      steps: baseSteps,
      completedSteps: new Set(),
      currentStep: baseSteps[0],
      totalSteps: 5,
      completedCount: 0,
    });

    render(<TutorialChecklist />);
    expect(screen.getByText("Guided Tour")).toBeInTheDocument();
  });

  test("shows progress count", () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      allComplete: false,
      steps: baseSteps,
      completedSteps: new Set(["set_alias", "complete_survey"]),
      currentStep: baseSteps[2],
      totalSteps: 5,
      completedCount: 2,
    });

    render(<TutorialChecklist />);
    expect(screen.getByText("2 of 5 complete")).toBeInTheDocument();
  });

  test("expands to show step list on click", () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      allComplete: false,
      steps: baseSteps,
      completedSteps: new Set(),
      currentStep: baseSteps[0],
      totalSteps: 5,
      completedCount: 0,
    });

    render(<TutorialChecklist />);

    // Click the header area to expand
    fireEvent.click(screen.getByText("Guided Tour"));

    // After expanding, step labels should appear
    expect(screen.getByText("Set your alias")).toBeInTheDocument();
    expect(screen.getByText("Complete the survey")).toBeInTheDocument();
    expect(screen.getByText("Explore the homepage")).toBeInTheDocument();
  });

  test("shows completed steps with strikethrough", () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      allComplete: false,
      steps: baseSteps,
      completedSteps: new Set(["set_alias"]),
      currentStep: baseSteps[1],
      totalSteps: 5,
      completedCount: 1,
    });

    render(<TutorialChecklist />);
    fireEvent.click(screen.getByText("Guided Tour"));

    const aliasStep = screen.getByText("Set your alias");
    expect(aliasStep).toHaveStyle("text-decoration: line-through");
  });

  test("returns null when context is null", () => {
    mockContextValue.mockReturnValue(null);

    const { container } = render(<TutorialChecklist />);
    expect(container.innerHTML).toBe("");
  });
});

describe("TutorialCelebration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders nothing when no celebration", () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      celebratingStep: null,
      celebratingTier: null,
      dismissCelebration: jest.fn(),
    });

    const { container } = render(<TutorialCelebration />);
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when not active", () => {
    mockContextValue.mockReturnValue({
      isActive: false,
      celebratingStep: "set_alias",
      celebratingTier: null,
      dismissCelebration: jest.fn(),
    });

    const { container } = render(<TutorialCelebration />);
    expect(container.innerHTML).toBe("");
  });

  test('shows "Nice work!" for step celebration', () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      celebratingStep: "set_alias",
      celebratingTier: null,
      dismissCelebration: jest.fn(),
    });

    render(<TutorialCelebration />);
    expect(screen.getByText("Nice work! +10 XP")).toBeInTheDocument();
  });

  test("shows tier name for tier celebration", () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      celebratingStep: "report_issue",
      celebratingTier: { tier: 1, name: "Getting Started", bonus: 50 },
      dismissCelebration: jest.fn(),
    });

    render(<TutorialCelebration />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Tier Complete!")).toBeInTheDocument();
    expect(screen.getByText("+50 XP Bonus!")).toBeInTheDocument();
  });

  test('shows "Click anywhere to continue" for tier celebration', () => {
    mockContextValue.mockReturnValue({
      isActive: true,
      celebratingStep: "report_issue",
      celebratingTier: { tier: 1, name: "Getting Started", bonus: 50 },
      dismissCelebration: jest.fn(),
    });

    render(<TutorialCelebration />);
    expect(screen.getByText("Click anywhere to continue")).toBeInTheDocument();
  });

  test("dismisses tier celebration on click", () => {
    const dismiss = jest.fn();
    mockContextValue.mockReturnValue({
      isActive: true,
      celebratingStep: "report_issue",
      celebratingTier: { tier: 1, name: "Getting Started", bonus: 50 },
      dismissCelebration: dismiss,
    });

    render(<TutorialCelebration />);
    fireEvent.click(screen.getByText("Click anywhere to continue"));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  test("returns null when context is null", () => {
    mockContextValue.mockReturnValue(null);

    const { container } = render(<TutorialCelebration />);
    expect(container.innerHTML).toBe("");
  });
});
