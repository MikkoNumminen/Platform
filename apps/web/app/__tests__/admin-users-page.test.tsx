import { render, screen } from "@testing-library/react";
import AdminUsersPage from "../admin/users/page";

const mockAuth = jest.fn();
const mockGetUsers = jest.fn();
const mockGetSurveyStatus = jest.fn();
const mockRedirect = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetUsersWithOverrides = jest.fn();

jest.mock("@/lib/user-queries", () => ({
  getUsers: () => mockGetUsers(),
  getUsersWithOverrides: (...args: unknown[]) => mockGetUsersWithOverrides(...args),
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

jest.mock("@/app/admin/users/ApproveButton", () => {
  return function MockApproveButton({ userId }: { userId: string }) {
    return <button data-testid={`approve-${userId}`}>Approve</button>;
  };
});

jest.mock("@/app/admin/users/DeveloperTagSelect", () => {
  return function MockDeveloperTagSelect() {
    return <span data-testid="dev-tag-select" />;
  };
});

jest.mock("@/app/admin/users/UserPermissionEditor", () => {
  return function MockUserPermissionEditor({
    userId,
    initialHasOverrides,
  }: {
    userId: string;
    initialHasOverrides: boolean;
  }) {
    return (
      <div data-testid={`permissions-${userId}`}>
        {initialHasOverrides && <span>Custom permissions</span>}
      </div>
    );
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
    mockGetUsersWithOverrides.mockClear();
    mockRedirect.mockClear();
    mockGetUsersWithOverrides.mockResolvedValue(new Set());
  });

  test("redirects when user lacks admin:users permission", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", permissions: {} } });
    await expect(AdminUsersPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  test("shows approve button for pending users", async () => {
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
    mockGetSurveyStatus.mockResolvedValue({ "user-1": false });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.getByTestId("approve-user-1")).toBeInTheDocument();
  });

  test("does not show approve button for non-pending users", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-1",
        email: "active@example.com",
        name: "Active User",
        alias: "active",
        image: null,
        role: "user",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({ "user-1": true });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.queryByTestId("approve-user-1")).not.toBeInTheDocument();
  });

  test("shows survey pending chip for any user who has not completed survey", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-1",
        email: "active@example.com",
        name: "Active User",
        alias: "active",
        image: null,
        role: "user",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({ "user-1": false });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.getByText("Survey pending")).toBeInTheDocument();
  });

  test("does not show survey pending chip when survey is completed", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetUsers.mockResolvedValue([
      {
        id: "user-1",
        email: "done@example.com",
        name: "Done User",
        alias: null,
        image: null,
        role: "vuohi",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    mockGetSurveyStatus.mockResolvedValue({ "user-1": true });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.queryByText("Survey pending")).not.toBeInTheDocument();
  });

  test("shows both approve button and survey pending for pending user without survey", async () => {
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
    mockGetSurveyStatus.mockResolvedValue({ "user-1": false });

    const result = await AdminUsersPage();
    render(result);
    expect(screen.getByTestId("approve-user-1")).toBeInTheDocument();
    expect(screen.getByText("Survey pending")).toBeInTheDocument();
  });

  test("queries survey status for all users", async () => {
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
    mockGetSurveyStatus.mockResolvedValue({ "user-1": false, "user-2": true });

    await AdminUsersPage();
    expect(mockGetSurveyStatus).toHaveBeenCalledWith(["user-1", "user-2"]);
  });
});
