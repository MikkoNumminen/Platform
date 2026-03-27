import { render, screen } from "@testing-library/react";
import AccountPage from "../account/page";

const mockSession = jest.fn();
const mockReplace = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession(),
  signOut: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/lib/gdpr-actions", () => ({
  deleteMyAccount: jest.fn(),
  exportMyData: jest.fn(),
}));

jest.mock("@/app/components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

describe("AccountPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to sign-in when not authenticated", () => {
    mockSession.mockReturnValue({ data: null });
    render(<AccountPage />);
    expect(mockReplace).toHaveBeenCalledWith("/auth/signin");
  });

  test("renders profile information when authenticated", () => {
    mockSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          alias: "tester",
          role: "user",
        },
      },
    });
    render(<AccountPage />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("tester")).toBeInTheDocument();
  });

  test("renders data export button", () => {
    mockSession.mockReturnValue({
      data: { user: { id: "u1", email: "a@b.com", name: "A" } },
    });
    render(<AccountPage />);
    expect(screen.getByRole("button", { name: /download my data/i })).toBeInTheDocument();
  });

  test("renders delete account button", () => {
    mockSession.mockReturnValue({
      data: { user: { id: "u1", email: "a@b.com", name: "A" } },
    });
    render(<AccountPage />);
    expect(screen.getByRole("button", { name: /delete my account/i })).toBeInTheDocument();
  });

  test("renders privacy policy link", () => {
    mockSession.mockReturnValue({
      data: { user: { id: "u1", email: "a@b.com", name: "A" } },
    });
    render(<AccountPage />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });
});
