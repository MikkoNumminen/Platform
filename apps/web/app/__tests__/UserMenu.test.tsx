import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import UserMenu from "../components/UserMenu";

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
let mockSession: { data: { user: Record<string, unknown> } | null } = {
  data: null,
};

const mockPush = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession,
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockSignOut.mockClear();
    mockPush.mockClear();
    mockSession = { data: null };
  });

  describe("when not logged in", () => {
    test("renders Sign In button", () => {
      render(<UserMenu />);
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    test("calls signIn when Sign In button is clicked", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole("button", { name: /sign in/i }));
      expect(mockSignIn).toHaveBeenCalled();
    });

    test("has no accessibility violations", async () => {
      const { container } = render(<UserMenu />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("when logged in", () => {
    beforeEach(() => {
      mockSession = {
        data: {
          user: {
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
            image: null,
          },
        },
      };
    });

    test("renders user avatar with initials", () => {
      render(<UserMenu />);
      expect(screen.getByText("TU")).toBeInTheDocument();
    });

    test("opens menu on avatar click", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole("button"));
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    test("user name links to account page", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole("button"));
      const accountLink = screen.getByRole("menuitem", { name: /test user/i });
      expect(accountLink).toHaveAttribute("href", "/account");
    });

    test("hides Manage Users when user lacks admin:users permission", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole("button"));
      expect(screen.queryByText("Manage Users")).not.toBeInTheDocument();
    });

    test("shows Manage Users link for admin users", async () => {
      mockSession = {
        data: {
          user: {
            id: "user-1",
            name: "Admin User",
            email: "admin@example.com",
            image: null,
            permissions: { "admin:users": true },
          },
        },
      };
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole("button"));
      const manageLink = screen.getByRole("menuitem", { name: /manage users/i });
      expect(manageLink).toHaveAttribute("href", "/admin/users");
    });

    test("calls signOut when Sign Out is clicked", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Sign Out"));
      expect(mockSignOut).toHaveBeenCalled();
    });

    test("has no accessibility violations", async () => {
      const { container } = render(<UserMenu />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("getInitials", () => {
    test("shows ? for user with no name", () => {
      mockSession = {
        data: {
          user: { id: "user-1", name: null, email: "test@example.com" },
        },
      };
      render(<UserMenu />);
      expect(screen.getByText("?")).toBeInTheDocument();
    });

    test("shows single initial for single-word name", () => {
      mockSession = {
        data: {
          user: { id: "user-1", name: "Alice", email: "test@example.com" },
        },
      };
      render(<UserMenu />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });
});
