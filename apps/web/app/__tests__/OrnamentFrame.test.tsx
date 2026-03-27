import { render, screen } from "@testing-library/react";
import OrnamentFrame from "../components/ui/OrnamentFrame";

const mockUseTheme = jest.fn();

jest.mock("../components/ThemeRegistry", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("OrnamentFrame", () => {
  test("renders children without ornaments for non-warcraft theme", () => {
    mockUseTheme.mockReturnValue({ currentTheme: "dark" });
    render(
      <OrnamentFrame>
        <div data-testid="child">Hello</div>
      </OrnamentFrame>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryAllByRole("img", { hidden: true })).toHaveLength(0);
  });

  test("renders corner ornaments for warcraft theme", () => {
    mockUseTheme.mockReturnValue({ currentTheme: "epic" });
    render(
      <OrnamentFrame>
        <div data-testid="child">Hello</div>
      </OrnamentFrame>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getAllByTestId("corner-ornament")).toHaveLength(4);
  });
});
