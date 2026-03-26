import { render, screen, fireEvent, act } from "@testing-library/react";
import SnackbarProvider, { useSnackbar } from "../components/SnackbarProvider";

function TestConsumer() {
  const { showSnackbar } = useSnackbar();
  return (
    <div>
      <button onClick={() => showSnackbar("Success!", "success")}>Show Success</button>
      <button onClick={() => showSnackbar("Error!", "error")}>Show Error</button>
      <button onClick={() => showSnackbar("Warning!", "warning")}>Show Warning</button>
      <button onClick={() => showSnackbar("Default severity")}>Show Default</button>
    </div>
  );
}

describe("SnackbarProvider", () => {
  test("renders children", () => {
    render(
      <SnackbarProvider>
        <div>Child content</div>
      </SnackbarProvider>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  test("shows success snackbar", () => {
    render(
      <SnackbarProvider>
        <TestConsumer />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });

  test("shows error snackbar", () => {
    render(
      <SnackbarProvider>
        <TestConsumer />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  test("shows warning snackbar", () => {
    render(
      <SnackbarProvider>
        <TestConsumer />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByText("Show Warning"));
    expect(screen.getByText("Warning!")).toBeInTheDocument();
  });

  test("defaults to success severity", () => {
    render(
      <SnackbarProvider>
        <TestConsumer />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByText("Show Default"));
    expect(screen.getByText("Default severity")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  test("supports multiple simultaneous snackbars", () => {
    render(
      <SnackbarProvider>
        <TestConsumer />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  test("dismisses snackbar when close button is clicked", () => {
    render(
      <SnackbarProvider>
        <TestConsumer />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success!")).toBeInTheDocument();

    // MUI Alert has a close button
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    act(() => {
      fireEvent.click(closeButtons[0]);
    });
    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
  });

  test("useSnackbar returns noop when used outside provider", () => {
    function Standalone() {
      const { showSnackbar } = useSnackbar();
      return <button onClick={() => showSnackbar("test")}>Click</button>;
    }
    render(<Standalone />);
    // Should not throw
    expect(() => fireEvent.click(screen.getByText("Click"))).not.toThrow();
  });
});
