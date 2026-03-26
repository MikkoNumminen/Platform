import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import SignInPage from "../auth/signin/page";

const mockSignIn = jest.fn();

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("SignInPage", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
  });

  test("renders sign in heading", () => {
    render(<SignInPage />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  test("renders Google sign in button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  test("renders GitHub sign in button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /continue with github/i })).toBeInTheDocument();
  });

  test("calls signIn with google provider when Google button clicked", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(mockSignIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });
  });

  test("calls signIn with github provider when GitHub button clicked", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    await user.click(screen.getByRole("button", { name: /continue with github/i }));
    expect(mockSignIn).toHaveBeenCalledWith("github", { callbackUrl: "/" });
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<SignInPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
