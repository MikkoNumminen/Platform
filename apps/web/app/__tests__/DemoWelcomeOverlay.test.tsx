import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

import DemoWelcomeOverlay from "@/app/components/DemoWelcomeOverlay";

describe("DemoWelcomeOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders nothing for non-demo users", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Alice" } },
      status: "authenticated",
    });
    const { container } = render(<DemoWelcomeOverlay />);
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing for unauthenticated users", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    const { container } = render(<DemoWelcomeOverlay />);
    expect(container.firstChild).toBeNull();
  });

  test("renders overlay for demo users", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Demo", demoSessionId: "demo-123" } },
      status: "authenticated",
    });
    render(<DemoWelcomeOverlay />);
    expect(screen.getByText("Welcome to the Demo")).toBeInTheDocument();
    expect(screen.getByText(/You're exploring the platform/)).toBeInTheDocument();
    expect(screen.getByText("Let's Go")).toBeInTheDocument();
  });

  test("dismisses on button click and sets localStorage", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", demoSessionId: "demo-123" } },
      status: "authenticated",
    });
    render(<DemoWelcomeOverlay />);
    expect(screen.getByText("Welcome to the Demo")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Let's Go"));
    expect(screen.queryByText("Welcome to the Demo")).not.toBeInTheDocument();
    expect(localStorage.getItem("demo-welcome-dismissed")).toBe("1");
  });

  test("clicking inside the card does not dismiss", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", demoSessionId: "demo-123" } },
      status: "authenticated",
    });
    render(<DemoWelcomeOverlay />);
    // Click the description text (inside the card)
    fireEvent.click(screen.getByText(/You're exploring the platform/));
    // Should still be visible
    expect(screen.getByText("Welcome to the Demo")).toBeInTheDocument();
  });

  test("does not show if already dismissed in localStorage", () => {
    localStorage.setItem("demo-welcome-dismissed", "1");
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", demoSessionId: "demo-123" } },
      status: "authenticated",
    });
    const { container } = render(<DemoWelcomeOverlay />);
    expect(container.firstChild).toBeNull();
  });
});
