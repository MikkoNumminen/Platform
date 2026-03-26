import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import Home from "../page";

describe("Home", () => {
  test("renders the heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Platform" })
    ).toBeInTheDocument();
  });

  test("renders the description", () => {
    render(<Home />);
    expect(
      screen.getByText("Community platform — coming soon.")
    ).toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<Home />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
