import { render, screen } from "@testing-library/react";
import AdminUsersPage from "../admin/users/page";

const mockAuth = jest.fn();
const mockGetUsers = jest.fn();
const mockGetSurveyStatus = jest.fn();
const mockRedirect = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/user-queries", () => ({
  getUsers: () => mockGetUsers(),
}));

jest.mock("@/lib/survey-user-queries", () => ({
  getUserSurveyStatus: (...args: unknown[]) => mockGetSurveyStatus(...args),
}));

jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("@/app/admin/users/UserRoleSelect", () => {
  return function MockUserRoleSelect({ currentRole }: { currentRole: string }) {
    return <span data-testid="role-select">{currentRole}</span>;
  };
});

const adminSession = {
  user: {
    id: "admin-1",
    permissions: { "admin:users": true },
  },
};

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockAuth.mockClear();
    mockGetUsers.mockClear();
    mockGetSurveyStatus.mockClear();
    mockRedirect.mockClear();
  });

  test("redirects when user lacks admin:users permission", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } });
    await expect(AdminUsersPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  test("shows 'Survey done' chip for pending user who completed survey", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-1",
        email: "new@example.com",
        name: "New User",
        alias: null,
        image: null,
        role: "pending",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({ "user-1": true });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.getByText("Survey done")).toBeInTheDocument();
    expect(screen.getByText("Needs approval")).toBeInTheDocument();
  });

  test("shows 'Survey pending' chip for pending user who has not completed survey", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-2",
        email: "waiting@example.com",
        name: "Waiting User",
        alias: null,
        image: null,
        role: "pending",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({ "user-2": false });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.getByText("Survey pending")).toBeInTheDocument();
  });

  test("does not show survey chips for non-pending users", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-3",
        email: "active@example.com",
        name: "Active User",
        alias: "active",
        image: null,
        role: "user",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({});

    const result = await AdminUsersPage();
    render(result);
    expect(screen.queryByText("Survey done")).not.toBeInTheDocument();
    expect(screen.queryByText("Survey pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Needs approval")).not.toBeInTheDocument();
  });

  test("only queries survey status for pending users", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-1",
        email: "a@example.com",
        name: "A",
        alias: null,
        image: null,
        role: "pending",
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "user-2",
        email: "b@example.com",
        name: "B",
        alias: "b",
        image: null,
        role: "user",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({ "user-1": false });

    await AdminUsersPage();
    expect(mockGetSurveyStatus).toHaveBeenCalledWith(["user-1"]);
  });
});
