import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";

const mockGetLatestXpGains = jest.fn();

jest.mock("@/lib/gamification/xp-actions", () => ({
  getLatestXpGains: (...args: unknown[]) => mockGetLatestXpGains(...args),
}));

jest.mock("@/lib/gamification/xp-config", () => ({
  getLevelForXp: (xp: number) => {
    if (xp >= 100) return { level: 2, xpRequired: 100, title: "Member" };
    return { level: 1, xpRequired: 0, title: "Newcomer" };
  },
}));

jest.mock(
  "./LevelUpCelebration",
  () => {
    return function MockLevelUpCelebration({ level, title }: { level: number; title: string }) {
      return <div data-testid="level-up">{`Level ${level} - ${title}`}</div>;
    };
  },
  { virtual: true },
);

import XpToastProvider, { useXpToast } from "../components/XpToastProvider";

function TestConsumer() {
  const { onAction } = useXpToast();
  return <button onClick={onAction}>Do Action</button>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("XpToastProvider", () => {
  test("renders children", () => {
    render(
      <XpToastProvider>
        <div data-testid="child">Hello</div>
      </XpToastProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  test("shows xp toast after onAction", async () => {
    mockGetLatestXpGains.mockResolvedValue({
      gains: [{ amount: 5, source: "shout:create" }],
      level: 1,
      totalXp: 5,
    });

    render(
      <XpToastProvider>
        <TestConsumer />
      </XpToastProvider>,
    );

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(screen.getByText("Do Action"));
    });

    expect(screen.getByText("+5 XP")).toBeInTheDocument();
    expect(screen.getByText("Shout")).toBeInTheDocument();
  });

  test("handles errors gracefully", async () => {
    mockGetLatestXpGains.mockRejectedValue(new Error("network error"));

    render(
      <XpToastProvider>
        <TestConsumer />
      </XpToastProvider>,
    );

    // Should not throw
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(screen.getByText("Do Action"));
    });

    // Children should still be rendered
    expect(screen.getByText("Do Action")).toBeInTheDocument();
  });
});
