import { render } from "@testing-library/react";
import PendingGate from "../components/PendingGate";

const mockReplace = jest.fn();
let mockSession: { data: { user: Record<string, unknown> } | null; status: string } = {
  data: null,
  status: "unauthenticated",
};
let mockPathname = "/";

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

describe("PendingGate", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSession = { data: null, status: "unauthenticated" };
    mockPathname = "/";
  });

  test("does nothing when not authenticated", () => {
    render(<PendingGate />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does nothing for non-pending users", () => {
    mockSession = {
      data: { user: { id: "1", role: "user" } },
      status: "authenticated",
    };
    render(<PendingGate />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("redirects pending user from home to /survey", () => {
    mockSession = {
      data: { user: { id: "1", role: "pending" } },
      status: "authenticated",
    };
    mockPathname = "/";
    render(<PendingGate />);
    expect(mockReplace).toHaveBeenCalledWith("/survey");
  });

  test("redirects pending user from /boards to /survey", () => {
    mockSession = {
      data: { user: { id: "1", role: "pending" } },
      status: "authenticated",
    };
    mockPathname = "/boards";
    render(<PendingGate />);
    expect(mockReplace).toHaveBeenCalledWith("/survey");
  });

  test("allows pending user to access /survey", () => {
    mockSession = {
      data: { user: { id: "1", role: "pending" } },
      status: "authenticated",
    };
    mockPathname = "/survey";
    render(<PendingGate />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("allows pending user to access /setup-alias", () => {
    mockSession = {
      data: { user: { id: "1", role: "pending" } },
      status: "authenticated",
    };
    mockPathname = "/setup-alias";
    render(<PendingGate />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("allows pending user to access /auth paths", () => {
    mockSession = {
      data: { user: { id: "1", role: "pending" } },
      status: "authenticated",
    };
    mockPathname = "/auth/signin";
    render(<PendingGate />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("renders nothing", () => {
    const { container } = render(<PendingGate />);
    expect(container.innerHTML).toBe("");
  });
});
