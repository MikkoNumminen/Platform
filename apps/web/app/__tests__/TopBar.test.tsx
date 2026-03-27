import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import TopBar from "../components/TopBar";

const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

jest.mock("../components/ThemeSwitcher", () => {
  return function MockThemeSwitcher() {
    return <button data-testid="theme-switcher">Theme</button>;
  };
});

jest.mock("../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">UserMenu</div>;
  };
});

describe("TopBar", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null });
  });

  test("renders the title", () => {
    render(<TopBar title="Test Title" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  test("renders the theme switcher", () => {
    render(<TopBar title="Test" />);
    expect(screen.getByTestId("theme-switcher")).toBeInTheDocument();
  });

  test("does not render back button when backHref is not provided", () => {
    render(<TopBar title="Test" />);
    expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
  });

  test("renders back button when backHref is provided", () => {
    render(<TopBar title="Test" backHref="/boards" />);
    const backButton = screen.getByRole("link", { name: "Go back" });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("href", "/boards");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<TopBar title="Test" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("has no accessibility violations with back button", async () => {
    const { container } = render(<TopBar title="Test" backHref="/" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("shows 'Vuohiliitto' for superuser when title is 'Platform'", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", role: "superuser" } } });
    render(<TopBar title="Platform" />);
    expect(screen.getByText("Vuohiliitto")).toBeInTheDocument();
    expect(screen.queryByText("Platform")).not.toBeInTheDocument();
  });

  test("shows 'Vuohiliitto' for vuohi when title is 'Platform'", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", role: "vuohi" } } });
    render(<TopBar title="Platform" />);
    expect(screen.getByText("Vuohiliitto")).toBeInTheDocument();
  });

  test("shows 'Platform' for regular user", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", role: "user" } } });
    render(<TopBar title="Platform" />);
    expect(screen.getByText("Platform")).toBeInTheDocument();
  });

  test("does not override non-Platform titles for superuser", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1", role: "superuser" } } });
    render(<TopBar title="Manage Users" />);
    expect(screen.getByText("Manage Users")).toBeInTheDocument();
    expect(screen.queryByText("Vuohiliitto")).not.toBeInTheDocument();
  });
});
