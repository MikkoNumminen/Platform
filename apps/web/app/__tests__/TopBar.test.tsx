import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import TopBar from "../components/TopBar";

jest.mock("../components/ThemeSwitcher", () => {
  return function MockThemeSwitcher() {
    return <button data-testid="theme-switcher">Theme</button>;
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

  test("has no accessibility violations", async () => {
    const { container } = render(<TopBar title="Test" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
