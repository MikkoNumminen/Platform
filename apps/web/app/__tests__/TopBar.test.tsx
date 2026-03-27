import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import TopBar from "../components/TopBar";

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
});
