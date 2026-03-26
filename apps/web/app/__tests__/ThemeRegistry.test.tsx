import { render, screen } from "@testing-library/react";
import ThemeRegistry, { useTheme } from "../components/ThemeRegistry";

function ThemeConsumer() {
  const { currentTheme } = useTheme();
  return <span data-testid="theme">{currentTheme}</span>;
}

describe("ThemeRegistry", () => {
  test("renders children", () => {
    render(
      <ThemeRegistry>
        <p>child content</p>
      </ThemeRegistry>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  test("provides default theme via context", () => {
    render(
      <ThemeRegistry>
        <ThemeConsumer />
      </ThemeRegistry>
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });
});
