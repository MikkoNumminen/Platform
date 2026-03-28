import { render, screen, fireEvent } from "@testing-library/react";
import Error from "../error";

describe("Error boundary", () => {
  const defaultProps = {
    error: new Error("Test error"),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders error heading", () => {
    render(<Error {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
  });

  it("renders descriptive message", () => {
    render(<Error {...defaultProps} />);
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
  });

  it("renders try again button", () => {
    render(<Error {...defaultProps} />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls reset when try again is clicked", () => {
    render(<Error {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(defaultProps.reset).toHaveBeenCalledTimes(1);
  });
});
