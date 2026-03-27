import { render, screen } from "@testing-library/react";
import PendingBanner from "../components/PendingBanner";

let mockSession: { data: { user: Record<string, unknown> } | null } = { data: null };

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession,
}));

describe("PendingBanner", () => {
  beforeEach(() => {
    mockSession = { data: null };
  });

  test("renders nothing when not logged in", () => {
    render(<PendingBanner />);
    expect(screen.queryByText(/pending approval/i)).not.toBeInTheDocument();
  });

  test("renders nothing when user role is not pending", () => {
    mockSession = { data: { user: { id: "u1", role: "user" } } };
    render(<PendingBanner />);
    expect(screen.queryByText(/pending approval/i)).not.toBeInTheDocument();
  });

  test("renders banner when user role is pending", () => {
    mockSession = { data: { user: { id: "u1", role: "pending" } } };
    render(<PendingBanner />);
    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
  });

  test("renders nothing for admin users", () => {
    mockSession = { data: { user: { id: "u1", role: "admin" } } };
    render(<PendingBanner />);
    expect(screen.queryByText(/pending approval/i)).not.toBeInTheDocument();
  });

  test("renders nothing for superuser", () => {
    mockSession = { data: { user: { id: "u1", role: "superuser" } } };
    render(<PendingBanner />);
    expect(screen.queryByText(/pending approval/i)).not.toBeInTheDocument();
  });
});
