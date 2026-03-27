import React from "react";
import { render } from "@testing-library/react";

const mockUseSession = jest.fn();
const mockReplace = jest.fn();
const mockUsePathname = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ replace: mockReplace }),
}));

import AliasGuard from "@/app/components/AliasGuard";

describe("AliasGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  test("renders nothing (returns null)", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = render(<AliasGuard />);
    expect(container.innerHTML).toBe("");
  });

  test("redirects authenticated user without alias", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Test", alias: null } },
      status: "authenticated",
    });
    render(<AliasGuard />);
    expect(mockReplace).toHaveBeenCalledWith("/setup-alias");
  });

  test("does not redirect when user has alias", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Test", alias: "myalias" } },
      status: "authenticated",
    });
    render(<AliasGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not redirect unauthenticated users", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<AliasGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not redirect on /setup-alias path", () => {
    mockUsePathname.mockReturnValue("/setup-alias");
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Test", alias: null } },
      status: "authenticated",
    });
    render(<AliasGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not redirect on /auth/signin path", () => {
    mockUsePathname.mockReturnValue("/auth/signin");
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Test", alias: null } },
      status: "authenticated",
    });
    render(<AliasGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not redirect while loading", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" });
    render(<AliasGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
