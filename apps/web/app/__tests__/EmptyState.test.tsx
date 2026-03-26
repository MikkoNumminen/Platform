import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import EmptyState from "../components/EmptyState";

describe("EmptyState", () => {
  test("renders the title", () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
  });

  test("renders the description when provided", () => {
    render(<EmptyState title="Empty" description="Nothing to see here" />);
    expect(screen.getByText("Nothing to see here")).toBeInTheDocument();
  });

  test("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("Nothing")).not.toBeInTheDocument();
  });

  test("renders action button when actionLabel and onAction are provided", () => {
    const onAction = jest.fn();
    render(<EmptyState title="Empty" actionLabel="Create one" onAction={onAction} />);
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });

  test("calls onAction when button is clicked", () => {
    const onAction = jest.fn();
    render(<EmptyState title="Empty" actionLabel="Create" onAction={onAction} />);
    fireEvent.click(screen.getByText("Create"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("does not render action button when only label is provided", () => {
    render(<EmptyState title="Empty" actionLabel="Create" />);
    expect(screen.queryByText("Create")).not.toBeInTheDocument();
  });

  test("renders icon when provided", () => {
    render(<EmptyState title="Empty" icon={<span data-testid="test-icon">X</span>} />);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  test("does not render icon container when no icon", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByTestId("test-icon")).not.toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(
      <EmptyState
        title="No data"
        description="Try adding something"
        actionLabel="Add"
        onAction={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
