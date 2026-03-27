import { render, screen } from "@testing-library/react";
import DecorativeDivider from "../components/ui/DecorativeDivider";

const mockUseTheme = jest.fn();

jest.mock("../components/ThemeRegistry", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("DecorativeDivider", () => {
  test("renders simple divider for non-warcraft theme", () => {
    mockUseTheme.mockReturnValue({ currentTheme: "dark" });
    render(<DecorativeDivider />);
    expect(screen.queryByTestId("decorative-diamond")).not.toBeInTheDocument();
  });

  test("renders decorative SVG divider for warcraft theme", () => {
    mockUseTheme.mockReturnValue({ currentTheme: "warcraft" });
    render(<DecorativeDivider />);
    expect(screen.getByTestId("decorative-diamond")).toBeInTheDocument();
  });
});
