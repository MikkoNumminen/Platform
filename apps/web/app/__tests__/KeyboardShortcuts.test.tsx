import { render, screen, fireEvent } from "@testing-library/react";
import KeyboardShortcuts from "../components/KeyboardShortcuts";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("KeyboardShortcuts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("opens help dialog when ? is pressed", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(document, { key: "?" });
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  test("help dialog is initially closed", () => {
    render(<KeyboardShortcuts />);
    expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
  });

  test("navigates to home on g then h", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(document, { key: "g" });
    fireEvent.keyDown(document, { key: "h" });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  test("does not navigate when typing in input", () => {
    render(
      <div>
        <input data-testid="input" />
        <KeyboardShortcuts />
      </div>,
    );
    const input = screen.getByTestId("input");
    fireEvent.keyDown(input, { key: "g" });
    fireEvent.keyDown(input, { key: "b" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("shows all shortcut labels in help dialog", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(document, { key: "?" });
    expect(screen.getByText("Go to Home")).toBeInTheDocument();
    expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
  });
});
