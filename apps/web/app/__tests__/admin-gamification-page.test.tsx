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
      achievement: {
        id: "a1",
        name: "First Post",
        icon: "star",
        description: "Create a post",
        xpReward: 50,
        tier: "bronze",
      },
      count: 8,
    },
  ],
  questCompletionRates: [
    {
      name: "Daily Login",
      icon: "calendar",
      description: "Log in today",
      xpReward: 10,
      type: "daily",
      completedCount: 3,
      totalUsers: 4,
      completionRate: 75,
    },
  ],
  recentActivity: [
    { amount: 10, user: "Alice", source: "post:create", createdAt: "2026-03-28T10:00:00Z" },
  ],
};

describe("GamificationDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects when user lacks required role", async () => {
    mockAuth.mockResolvedValue({ user: { role: "admin", permissions: { "admin:users": true } } });
    await expect(GamificationDashboardPage()).rejects.toThrow("REDIRECT:/");
  });

  test("redirects when user is a regular user", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user", permissions: {} } });
    await expect(GamificationDashboardPage()).rejects.toThrow("REDIRECT:/");
  });

  test("redirects when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(GamificationDashboardPage()).rejects.toThrow("REDIRECT:/");
  });

  test("renders dashboard for superuser", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Vuohiliitto Dashboard");
    expect(screen.getByText("10")).toBeInTheDocument(); // Active Players
    expect(screen.getByText("5,000")).toBeInTheDocument(); // Total XP
  });

  test("renders dashboard for vuohi", async () => {
    mockAuth.mockResolvedValue({ user: { role: "vuohi", permissions: { "admin:users": true } } });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Vuohiliitto Dashboard");
  });

  test("renders manage link", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText("Manage Achievements & Quests")).toBeInTheDocument();
  });

  test("renders level distribution with completion icons", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText("Level Distribution")).toBeInTheDocument();
    expect(screen.getByText(/Newcomer/)).toBeInTheDocument();
    expect(screen.getByText(/Explorer/)).toBeInTheDocument();
    // Level 1 has 5 users (completed) — shows CheckCircleIcon
    // Level 2 has 3 users (completed) — shows CheckCircleIcon
    const checkIcons = screen.getAllByTestId("CheckCircleIcon");
    expect(checkIcons).toHaveLength(2);
  });

  test("renders unchecked icon for levels with no users", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
    const statsWithEmpty = {
      ...mockStats,
      levelDistribution: [
        { level: 1, title: "Newcomer", count: 5 },
        { level: 2, title: "Explorer", count: 0 },
      ],
    };
    mockGetGamificationStats.mockResolvedValue(statsWithEmpty);
    const page = await GamificationDashboardPage();
    render(page);
    // Level 1 has users — CheckCircle, Level 2 has 0 — RadioButtonUnchecked
    const checkIcons = screen.getAllByTestId("CheckCircleIcon");
    const uncheckedIcons = screen.getAllByTestId("RadioButtonUncheckedIcon");
    expect(checkIcons).toHaveLength(1);
    expect(uncheckedIcons).toHaveLength(1);
  });

  test("renders top achievements", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("8 users")).toBeInTheDocument();
  });

  test("renders recent activity", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
    mockGetGamificationStats.mockResolvedValue(mockStats);
    const page = await GamificationDashboardPage();
    render(page);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });
});
