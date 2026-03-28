import { render, screen } from "@testing-library/react";

const mockAuth = jest.fn();
const mockAchievementFindMany = jest.fn();
const mockQuestFindMany = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    achievement: { findMany: (...a: unknown[]) => mockAchievementFindMany(...a) },
    quest: { findMany: (...a: unknown[]) => mockQuestFindMany(...a) },
  },
}));

jest.mock("../admin/gamification/manage/ManageGamification", () => {
  return function MockManageGamification({
    achievements,
    quests,
  }: {
    achievements: unknown[];
    quests: unknown[];
  }) {
    return (
      <div data-testid="manage">
        achievements:{achievements.length} quests:{quests.length}
      </div>
    );
  };
});

import ManageGamificationPage from "../admin/gamification/manage/page";

describe("ManageGamificationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects when user lacks admin:users permission", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: {} } });
    await expect(ManageGamificationPage()).rejects.toThrow("REDIRECT:/");
  });

  test("redirects when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(ManageGamificationPage()).rejects.toThrow("REDIRECT:/");
  });

  test("renders ManageGamification with data", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockAchievementFindMany.mockResolvedValue([
      { id: "a1", key: "first-post", criteria: { action: "post:create" } },
      { id: "a2", key: "explorer", criteria: { action: "login" } },
    ]);
    mockQuestFindMany.mockResolvedValue([
      { id: "q1", key: "daily-login", criteria: { action: "login" } },
    ]);
    const page = await ManageGamificationPage();
    render(page);
    expect(screen.getByText(/achievements:2/)).toBeInTheDocument();
    expect(screen.getByText(/quests:1/)).toBeInTheDocument();
  });

  test("renders empty state when no data", async () => {
    mockAuth.mockResolvedValue({ user: { permissions: { "admin:users": true } } });
    mockAchievementFindMany.mockResolvedValue([]);
    mockQuestFindMany.mockResolvedValue([]);
    const page = await ManageGamificationPage();
    render(page);
    expect(screen.getByText(/achievements:0/)).toBeInTheDocument();
    expect(screen.getByText(/quests:0/)).toBeInTheDocument();
  });
});
