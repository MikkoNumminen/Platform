import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import Home from "../page";

jest.mock("../components/TopBar", () => {
  return function MockTopBar({ title }: { title: string }) {
    return <div data-testid="topbar">{title}</div>;
  };
});

describe("Home", () => {
  test("renders the TopBar with title", () => {
    render(<Home />);
    expect(screen.getByTestId("topbar")).toHaveTextContent("Platform");
  });

  test("renders the survey CTA heading", () => {
    render(<Home />);
    expect(screen.getByText("Help us build this")).toBeInTheDocument();
  });

  test("renders survey link", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: /take the survey/i });
    expect(link).toHaveAttribute("href", "/survey");
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<Home />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
