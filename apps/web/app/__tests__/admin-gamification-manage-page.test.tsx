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

jest.mock("../admin/dashboard/manage/ManageGamification", () => {
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

import ManageGamificationPage from "../admin/dashboard/manage/page";

describe("ManageGamificationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects when user is admin (not vuohi/superuser)", async () => {
    mockAuth.mockResolvedValue({ user: { role: "admin", permissions: { "admin:users": true } } });
    await expect(ManageGamificationPage()).rejects.toThrow("REDIRECT:/");
  });

  test("redirects when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(ManageGamificationPage()).rejects.toThrow("REDIRECT:/");
  });

  test("redirects when user is regular user", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user", permissions: {} } });
    await expect(ManageGamificationPage()).rejects.toThrow("REDIRECT:/");
  });

  test("renders ManageGamification with data for superuser", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "superuser", permissions: { "admin:users": true } },
    });
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

  test("renders ManageGamification for vuohi", async () => {
    mockAuth.mockResolvedValue({ user: { role: "vuohi", permissions: { "admin:users": true } } });
    mockAchievementFindMany.mockResolvedValue([]);
    mockQuestFindMany.mockResolvedValue([]);
    const page = await ManageGamificationPage();
    render(page);
    expect(screen.getByText(/achievements:0/)).toBeInTheDocument();
    expect(screen.getByText(/quests:0/)).toBeInTheDocument();
  });
});
