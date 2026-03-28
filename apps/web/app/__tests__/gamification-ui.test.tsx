import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

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

import LevelUpCelebration from "../components/LevelUpCelebration";

describe("LevelUpCelebration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders level number and title", () => {
    render(<LevelUpCelebration level={5} title="Regular" />);
    expect(screen.getByText("Level 5")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();
  });

  test("renders 'Level Up!' text", () => {
    render(<LevelUpCelebration level={3} title="Active Member" />);
    expect(screen.getByText("Level Up!")).toBeInTheDocument();
  });

  test("renders particle emojis", () => {
    const { container } = render(<LevelUpCelebration level={2} title="Member" />);
    const emojis = ["⭐", "✨", "🎉", "💫", "🏆", "⬆️"];
    // The up arrow appears twice (once as particle, once as main icon), so check at least one of each
    for (const emoji of emojis) {
      expect(container.textContent).toContain(emoji);
    }
  });

  test("auto-dismisses after 3500ms", () => {
    const onComplete = jest.fn();
    const { container } = render(
      <LevelUpCelebration level={2} title="Member" onComplete={onComplete} />,
    );

    expect(screen.getByText("Level 2")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("");
  });

  test("dismisses on click", () => {
    const onComplete = jest.fn();
    render(<LevelUpCelebration level={2} title="Member" onComplete={onComplete} />);

    // Click the overlay (the root motion.div has onClick)
    fireEvent.click(screen.getByText("Click anywhere to continue"));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("calls onComplete callback on dismiss", () => {
    const onComplete = jest.fn();
    render(<LevelUpCelebration level={4} title="Contributor" onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("renders 'Click anywhere to continue' text", () => {
    render(<LevelUpCelebration level={2} title="Member" />);
    expect(screen.getByText("Click anywhere to continue")).toBeInTheDocument();
  });
});
