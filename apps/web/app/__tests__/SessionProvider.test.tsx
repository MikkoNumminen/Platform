import { render, screen } from "@testing-library/react";
import SessionProvider from "../components/SessionProvider";

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe("SessionProvider", () => {
  test("renders children", () => {
    render(
      <SessionProvider>
        <p>Test child</p>
      </SessionProvider>,
    );
    expect(screen.getByText("Test child")).toBeInTheDocument();
  });

  test("wraps children with NextAuthSessionProvider", () => {
    render(
      <SessionProvider>
        <p>Test child</p>
      </SessionProvider>,
    );
    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
  });
});
