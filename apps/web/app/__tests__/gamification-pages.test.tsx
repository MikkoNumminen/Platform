import { render, screen } from "@testing-library/react";

const mockAuth = jest.fn();
const mockGetLeaderboard = jest.fn();
const mockGetActiveQuests = jest.fn();
const mockGetAllAchievementsWithStatus = jest.fn();
const mockGetUserXpData = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

jest.mock("@/lib/gamification", () => ({
  getLeaderboard: (...a: unknown[]) => mockGetLeaderboard(...a),
  getActiveQuests: (...a: unknown[]) => mockGetActiveQuests(...a),
  getAllAchievementsWithStatus: (...a: unknown[]) => mockGetAllAchievementsWithStatus(...a),
  getUserXpData: (...a: unknown[]) => mockGetUserXpData(...a),
  getXpProgress: (xp: number) => ({ level: 1, currentXp: xp, requiredXp: 100, title: "Novice" }),
}));

jest.mock("../leaderboard/LeaderboardView", () => {
  return function MockLeaderboardView({
    entries,
    currentUserId,
  }: {
    entries: unknown[];
    currentUserId: string;
  }) {
    return (
      <div data-testid="leaderboard">
        entries:{entries.length} user:{currentUserId}
      </div>
    );
  };
});

jest.mock("../quests/QuestLog", () => {
  return function MockQuestLog({ quests }: { quests: unknown[] }) {
    return <div data-testid="quest-log">quests:{quests.length}</div>;
  };
});

jest.mock("../achievements/AchievementShowcase", () => {
  return function MockAchievementShowcase({ achievements }: { achievements: unknown[] }) {
    return <div data-testid="achievements">achievements:{achievements.length}</div>;
  };
});

import LeaderboardPage from "../leaderboard/page";
import QuestsPage from "../quests/page";
import AchievementsPage from "../achievements/page";

describe("LeaderboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserXpData.mockResolvedValue({ totalXp: 100 });
  });

  test("redirects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(LeaderboardPage()).rejects.toThrow("REDIRECT:/auth/signin");
  });

  test("renders leaderboard with entries", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetLeaderboard.mockResolvedValue([
      { userId: "user-1", alias: "Alice", totalXp: 500 },
      { userId: "user-2", alias: "Bob", totalXp: 300 },
    ]);
    const page = await LeaderboardPage();
    render(page);
    expect(screen.getByText(/entries:2/)).toBeInTheDocument();
    expect(screen.getByText(/user:user-1/)).toBeInTheDocument();
  });

  test("requests top 50 entries", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetLeaderboard.mockResolvedValue([]);
    await LeaderboardPage();
    expect(mockGetLeaderboard).toHaveBeenCalledWith(50);
  });
});

describe("QuestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserXpData.mockResolvedValue({ totalXp: 50 });
  });

  test("redirects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(QuestsPage()).rejects.toThrow("REDIRECT:/auth/signin");
  });

  test("renders quest log with quests", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetActiveQuests.mockResolvedValue([
      { id: "q1", name: "Daily Login" },
      { id: "q2", name: "Post Something" },
      { id: "q3", name: "Create Event" },
    ]);
    const page = await QuestsPage();
    render(page);
    expect(screen.getByText("quests:3")).toBeInTheDocument();
  });
});

describe("AchievementsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserXpData.mockResolvedValue({ totalXp: 200 });
  });

  test("redirects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(AchievementsPage()).rejects.toThrow("REDIRECT:/auth/signin");
  });

  test("renders achievements showcase", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetAllAchievementsWithStatus.mockResolvedValue([
      { id: "a1", name: "First Post", unlocked: true },
      { id: "a2", name: "Explorer", unlocked: false },
    ]);
    const page = await AchievementsPage();
    render(page);
    expect(screen.getByText("achievements:2")).toBeInTheDocument();
  });
});
