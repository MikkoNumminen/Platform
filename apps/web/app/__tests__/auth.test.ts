import { handlers, auth } from "@/auth";

jest.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: jest.fn(), count: jest.fn(), upsert: jest.fn() },
    demoSession: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/permissions", () => ({
  resolvePermissions: jest.fn(() => ({})),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "google", name: "Google", type: "oidc" })),
}));

jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: { id: "github", name: "GitHub", type: "oauth" },
}));

jest.mock("@/lib/demo-session", () => ({
  getDemoSessionId: jest.fn().mockResolvedValue(null),
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
