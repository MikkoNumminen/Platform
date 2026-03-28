import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import LevelUpCelebration from "../components/LevelUpCelebration";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safe: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!["initial", "animate", "transition", "exit", "whileHover", "whileTap"].includes(k)) {
          safe[k] = v;
        }
      }
      return <div {...safe}>{children}</div>;
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safe: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!["initial", "animate", "transition", "exit", "whileHover", "whileTap"].includes(k)) {
          safe[k] = v;
        }
      }
      return <p {...safe}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LevelUpCelebration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders level number", () => {
    render(<LevelUpCelebration level={5} title="Adventurer" />);
    expect(screen.getByText("Level 5")).toBeInTheDocument();
  });

  test("renders level title", () => {
    render(<LevelUpCelebration level={3} title="Explorer" />);
    expect(screen.getByText("Explorer")).toBeInTheDocument();
  });

  test("renders Level Up text", () => {
    render(<LevelUpCelebration level={2} title="Novice" />);
    expect(screen.getByText("Level Up!")).toBeInTheDocument();
  });

  test("renders click to continue text", () => {
    render(<LevelUpCelebration level={2} title="Novice" />);
    expect(screen.getByText("Click anywhere to continue")).toBeInTheDocument();
  });

  test("calls onComplete after timeout", () => {
    const onComplete = jest.fn();
    render(<LevelUpCelebration level={2} title="Novice" onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("calls onComplete on click", () => {
    const onComplete = jest.fn();
    render(<LevelUpCelebration level={2} title="Novice" onComplete={onComplete} />);

    // Click the "Click anywhere to continue" text — bubbles up to overlay
    fireEvent.click(screen.getByText("Click anywhere to continue"));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("renders particle emojis", () => {
    render(<LevelUpCelebration level={2} title="Novice" />);
    // The component renders 6 particle divs with emojis including ⬆️ (main icon + particle)
    expect(screen.getAllByText("⬆️").length).toBeGreaterThanOrEqual(1);
  });
});
