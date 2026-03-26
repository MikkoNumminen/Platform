import { handlers, auth } from "@/auth";

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: { id: "google", name: "Google", type: "oidc" },
}));

jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: { id: "github", name: "GitHub", type: "oauth" },
}));

jest.mock("next-auth", () => {
  const mockHandlers = {
    GET: jest.fn(),
    POST: jest.fn(),
  };
  const mockAuth = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignOut = jest.fn();

  return {
    __esModule: true,
    default: jest.fn(() => ({
      handlers: mockHandlers,
      auth: mockAuth,
      signIn: mockSignIn,
      signOut: mockSignOut,
    })),
  };
});

describe("auth", () => {
  test("exports handlers with GET and POST", () => {
    expect(handlers).toBeDefined();
    expect(handlers.GET).toBeDefined();
    expect(handlers.POST).toBeDefined();
  });

  test("exports auth function", () => {
    expect(auth).toBeDefined();
  });
});
