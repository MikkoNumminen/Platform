import { render, screen } from "@testing-library/react";

const mockAuth = jest.fn();
const mockGetIssueReports = jest.fn();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/issue-queries", () => ({
  getIssueReports: () => mockGetIssueReports(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("../issues/IssueList", () => {
  return function MockIssueList({
    open,
    resolved,
    canResolve,
  }: {
    open: unknown[];
    resolved: unknown[];
    canResolve: boolean;
  }) {
    return (
      <div data-testid="issue-list">
        <span>open:{open.length}</span>
        <span>resolved:{resolved.length}</span>
        <span>canResolve:{String(canResolve)}</span>
      </div>
    );
  };
});

import IssuesPage from "../issues/page";

describe("IssuesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to sign-in when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(IssuesPage()).rejects.toThrow("REDIRECT:/auth/signin");
  });

  test("redirects pending users to home", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "pending" } });
    await expect(IssuesPage()).rejects.toThrow("REDIRECT:/");
  });

  test("renders empty state when no issues", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mockGetIssueReports.mockResolvedValue([]);
    const page = await IssuesPage();
    render(page);
    expect(screen.getByText("No issues reported yet.")).toBeInTheDocument();
  });

  test("renders TopBar with correct title", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mockGetIssueReports.mockResolvedValue([]);
    const page = await IssuesPage();
    render(page);
    expect(screen.getByText("Issues")).toBeInTheDocument();
  });

  test("renders issue list with open and resolved counts", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "admin" } });
    mockGetIssueReports.mockResolvedValue([
      { id: "1", title: "Bug", resolved: false },
      { id: "2", title: "Fixed", resolved: true },
      { id: "3", title: "Another", resolved: false },
    ]);
    const page = await IssuesPage();
    render(page);
    expect(screen.getByText("open:2")).toBeInTheDocument();
    expect(screen.getByText("resolved:1")).toBeInTheDocument();
  });

  test("superuser can resolve issues", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "superuser" } });
    mockGetIssueReports.mockResolvedValue([{ id: "1", title: "Bug", resolved: false }]);
    const page = await IssuesPage();
    render(page);
    expect(screen.getByText("canResolve:true")).toBeInTheDocument();
  });

  test("non-superuser cannot resolve issues", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "admin" } });
    mockGetIssueReports.mockResolvedValue([{ id: "1", title: "Bug", resolved: false }]);
    const page = await IssuesPage();
    render(page);
    expect(screen.getByText("canResolve:false")).toBeInTheDocument();
  });
});
