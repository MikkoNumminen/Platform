import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import ResultsBarChart from "../components/survey/ResultsBarChart";

describe("ResultsBarChart", () => {
  test("renders the title", () => {
    render(<ResultsBarChart title="Test Chart" items={[]} />);
    expect(screen.getByText("Test Chart")).toBeInTheDocument();
  });

  test("shows no responses message when empty", () => {
    render(<ResultsBarChart title="Test Chart" items={[]} />);
    expect(screen.getByText("No responses yet")).toBeInTheDocument();
  });

  test("renders bars for each item", () => {
    const items = [
      { label: "Option A", count: 5 },
      { label: "Option B", count: 3 },
    ];
    render(<ResultsBarChart title="Test Chart" items={items} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("renders meter roles for bars", () => {
    const items = [{ label: "Option A", count: 5 }];
    render(<ResultsBarChart title="Test Chart" items={items} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "5");
  });

  test("has no accessibility violations", async () => {
    const items = [
      { label: "Option A", count: 5 },
      { label: "Option B", count: 3 },
    ];
    const { container } = render(<ResultsBarChart title="Test Chart" items={items} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
