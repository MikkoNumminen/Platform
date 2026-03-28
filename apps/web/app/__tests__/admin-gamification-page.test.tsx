import { render, screen } from "@testing-library/react";

const mockAuth = jest.fn();
const mockGetGamificationStats = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("@/lib/gamification/admin-queries", () => ({
  getGamificationStats: () => mockGetGamificationStats(),
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

import GamificationDashboardPage from "../admin/gamification/page";

const mockStats = {
  summary: {
    totalUsersWithXp: 10,
    totalXpAwarded: 5000,
    averageXp: 500,
    highestXp: 1200,
  },
  levelDistribution: [
    { level: 1, title: "Newcomer", count: 5 },
    { level: 2, title: "Explorer", count: 3 },
  ],
  topAchievements: [
    {
      achievement: { id: "a1", name: "First Post", icon: "star", description: "Create a post" },
      count: 8,
    },
  ],
  questCompletionRates: [{ name: "Daily Login", icon: "calendar", completionRate: 75 }],
  recentActivity: [
    { amount: 10, user: "Alice", source: "post:create", createdAt: "2026-03-28T10:00:00Z" },
  ],
};

describe("GamificationDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects when user lacks admin:users permission", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: {} } });
    await expect(GamificationDashboardPage()).rejects.toThrow("REDIRECT:/");
  });

  test("renders dashboard with stats", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Gamification Dashboard");
    expect(screen.getByText("10")).toBeInTheDocument(); // Active Players
    expect(screen.getByText("5,000")).toBeInTheDocument(); // Total XP
  });

  test("renders manage link", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText("Manage Achievements & Quests")).toBeInTheDocument();
  });

  test("renders level distribution", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText("Level Distribution")).toBeInTheDocument();
    expect(screen.getByText(/Newcomer/)).toBeInTheDocument();
  });

  test("renders top achievements", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("8 users")).toBeInTheDocument();
  });

  test("renders recent activity", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });
});
