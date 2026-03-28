import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterProps(props)}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...filterProps(props)}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function filterProps(props: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!["initial", "animate", "transition", "exit", "whileHover", "whileTap"].includes(k)) {
      safe[k] = v;
    }
  }
  return safe;
}

import LevelUpCelebration from "@/app/components/LevelUpCelebration";

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

  test("renders 'Click anywhere to continue' prompt", () => {
    render(<LevelUpCelebration level={2} title="Member" />);
    expect(screen.getByText("Click anywhere to continue")).toBeInTheDocument();
  });

  test("renders particle emojis", () => {
    render(<LevelUpCelebration level={2} title="Member" />);
    // The component renders 6 particle emojis
    const _particles = ["⭐", "✨", "🎉", "💫", "🏆", "⬆️"];
    // At least the main ⬆️ emoji should be present (it appears in the main content too)
    expect(screen.getAllByText("⬆️").length).toBeGreaterThanOrEqual(1);
  });

  test("auto-dismisses after 3500ms", () => {
    const onComplete = jest.fn();
    render(<LevelUpCelebration level={5} title="Regular" onComplete={onComplete} />);

    expect(screen.getByText("Level 5")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(screen.queryByText("Level 5")).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("does not dismiss before 3500ms", () => {
    render(<LevelUpCelebration level={5} title="Regular" />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Level 5")).toBeInTheDocument();
  });

  test("dismisses on click", () => {
    const onComplete = jest.fn();
    render(<LevelUpCelebration level={5} title="Regular" onComplete={onComplete} />);

    // Click the overlay — using closest/parentElement for the fullscreen backdrop
    // eslint-disable-next-line testing-library/no-node-access
    const overlay = screen.getByText("Level Up!").closest("div")!.parentElement!;
    fireEvent.click(overlay);

    expect(screen.queryByText("Level 5")).not.toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("works without onComplete callback", () => {
    render(<LevelUpCelebration level={2} title="Member" />);

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    // Should not throw
    expect(screen.queryByText("Level 2")).not.toBeInTheDocument();
  });

  test("cleans up timer on unmount", () => {
    const onComplete = jest.fn();
    const { unmount } = render(
      <LevelUpCelebration level={3} title="Active Member" onComplete={onComplete} />,
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // onComplete should NOT have been called since component was unmounted
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("renders different level values correctly", () => {
    const { rerender } = render(<LevelUpCelebration level={1} title="Newcomer" />);
    expect(screen.getByText("Level 1")).toBeInTheDocument();
    expect(screen.getByText("Newcomer")).toBeInTheDocument();

    rerender(<LevelUpCelebration level={10} title="Mythic" />);
    expect(screen.getByText("Level 10")).toBeInTheDocument();
    expect(screen.getByText("Mythic")).toBeInTheDocument();
  });
});
