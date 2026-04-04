import React from "react";

const mockAuth = jest.fn();
const mockRedirect = jest.fn();
const mockGetAuditLogs = jest.fn();
const mockGetAuditActionTypes = jest.fn();

jest.mock("@/app/components/TutorialProvider", () => ({
  useTutorialMaybe: () => null,
}));

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
  usePathname: () => "/admin/audit-log",
}));

jest.mock("@/lib/audit-queries", () => ({
  getAuditLogs: (...a: unknown[]) => mockGetAuditLogs(...a),
  getAuditActionTypes: (...a: unknown[]) => mockGetAuditActionTypes(...a),
}));

jest.mock("@/lib/tenant", () => ({
  getActiveTenant: jest.fn().mockResolvedValue("vuohiliitto"),
  getTenantFilter: jest.fn().mockResolvedValue({ tenant: "vuohiliitto", sessionId: null }),
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { render } from "@testing-library/react";
import AuditLogPage from "../admin/audit-log/page";

describe("AuditLogPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuditLogs.mockResolvedValue({
      logs: [
        {
          id: "log-1",
          action: "user.updateRole",
          entityType: "User",
          entityId: "user-1",
          actorId: "admin-1",
          actorName: "Admin",
          details: { oldValues: { role: "user" }, newValues: { role: "admin" } },
          createdAt: new Date("2026-03-29T12:00:00Z"),
        },
      ],
      total: 1,
    });
    mockGetAuditActionTypes.mockResolvedValue(["user.updateRole"]);
  });

  test("redirects non-superuser", async () => {
    mockAuth.mockResolvedValue({ user: { role: "admin" } });

    await expect(AuditLogPage()).rejects.toThrow("REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  test("redirects unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(AuditLogPage()).rejects.toThrow("REDIRECT:/");
  });

  test("renders for superuser with audit logs", async () => {
    mockAuth.mockResolvedValue({ user: { role: "superuser" } });

    const page = await AuditLogPage();
    const { container } = render(page);

    expect(container.textContent).toContain("Audit Log");
    expect(container.textContent).toContain("1 total entries");
    expect(container.textContent).toContain("Admin");
    expect(container.textContent).toContain("user → updateRole");
  });

  test("renders empty state when no logs", async () => {
    mockAuth.mockResolvedValue({ user: { role: "superuser" } });
    mockGetAuditLogs.mockResolvedValue({ logs: [], total: 0 });
    mockGetAuditActionTypes.mockResolvedValue([]);

    const page = await AuditLogPage();
    const { container } = render(page);

    expect(container.textContent).toContain("No audit log entries yet.");
  });
});
