import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/lib/gamification/admin-actions", () => ({
  createAchievement: jest.fn().mockResolvedValue(undefined),
  updateAchievement: jest.fn().mockResolvedValue(undefined),
  deleteAchievement: jest.fn().mockResolvedValue(undefined),
  createQuest: jest.fn().mockResolvedValue(undefined),
  updateQuest: jest.fn().mockResolvedValue(undefined),
  deleteQuest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

import ManageGamification from "../admin/gamification/manage/ManageGamification";

const sampleAchievements = [
  {
    id: "a1",
    key: "first-post",
    name: "First Post",
    description: "Create your first post",
    icon: "star",
    tier: "bronze",
    category: "content",
    xpReward: 50,
    criteria: { action: "post:create", count: 1 },
    sortOrder: 0,
  },
];

const sampleQuests = [
  {
    id: "q1",
    key: "daily-login",
    name: "Daily Login",
    description: "Log in today",
    icon: "calendar",
    type: "daily",
    xpReward: 10,
    criteria: { action: "daily:login", count: 1 },
    repeatable: true,
    sortOrder: 0,
  },
];

describe("ManageGamification", () => {
  test("renders TopBar with title", () => {
    render(<ManageGamification achievements={[]} quests={[]} />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Manage Achievements & Quests");
  });

  test("renders Achievements and Quests tabs", () => {
    render(<ManageGamification achievements={[]} quests={[]} />);
    expect(screen.getByRole("tab", { name: /achievements/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /quests/i })).toBeInTheDocument();
  });

  test("renders achievement cards", () => {
    render(<ManageGamification achievements={sampleAchievements} quests={[]} />);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText(/Create your first post/)).toBeInTheDocument();
  });

  test("renders quest cards when Quests tab is selected", async () => {
    render(<ManageGamification achievements={[]} quests={sampleQuests} />);
    const questsTab = screen.getByRole("tab", { name: /quests/i });
    await userEvent.click(questsTab);
    expect(screen.getByText("Daily Login")).toBeInTheDocument();
    expect(screen.getByText(/Log in today/)).toBeInTheDocument();
  });

  test("renders empty state for achievements", () => {
    render(<ManageGamification achievements={[]} quests={[]} />);
    expect(screen.getByText(/no achievements/i)).toBeInTheDocument();
  });

  test("renders add achievement button", () => {
    render(<ManageGamification achievements={[]} quests={[]} />);
    expect(screen.getByRole("button", { name: /new achievement/i })).toBeInTheDocument();
  });

  test("renders achievement tier chip", () => {
    render(<ManageGamification achievements={sampleAchievements} quests={[]} />);
    expect(screen.getByText("bronze")).toBeInTheDocument();
  });
});
