const mockDecode = jest.fn();

jest.mock("next-auth/jwt", () => ({
  decode: (...args: unknown[]) => mockDecode(...args),
}));

// Mock NextResponse and NextRequest to avoid edge runtime dependencies
const mockRedirect = jest.fn();
const mockNext = jest.fn();

jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    nextUrl: { pathname: string };
    cookies: Map<string, { value: string }>;

    constructor(url: string) {
      this.url = url;
      this.nextUrl = { pathname: new URL(url).pathname };
      this.cookies = new Map();
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      redirect: (url: URL) => {
        mockRedirect(url.toString());
        return { status: 307, headers: new Map([["location", url.toString()]]) };
      },
      next: () => {
        mockNext();
        return { status: 200 };
      },
    },
  };
});

import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function makeRequest(path: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost:3100${path}`;
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, { value } as { value: string });
  }
  return req;
}

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = "test-secret";
  });

  test("redirects to signin when no session token on admin route", async () => {
    await middleware(makeRequest("/admin/users"));
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"));
  });

  test("redirects to home when user has non-admin role", async () => {
    mockDecode.mockResolvedValue({ role: "user" });
    await middleware(makeRequest("/admin/users", { "authjs.session-token": "tok" }));
    expect(mockRedirect).toHaveBeenCalledWith("http://localhost:3100/");
  });

  test("redirects to home when user has pending role", async () => {
    mockDecode.mockResolvedValue({ role: "pending" });
    await middleware(makeRequest("/admin/users", { "authjs.session-token": "tok" }));
    expect(mockRedirect).toHaveBeenCalledWith("http://localhost:3100/");
  });

  test("allows admin role to access admin routes", async () => {
    mockDecode.mockResolvedValue({ role: "admin" });
    await middleware(makeRequest("/admin/users", { "authjs.session-token": "tok" }));
    expect(mockNext).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  test("allows vuohi role to access admin routes", async () => {
    mockDecode.mockResolvedValue({ role: "vuohi" });
    await middleware(makeRequest("/admin/users", { "authjs.session-token": "tok" }));
    expect(mockNext).toHaveBeenCalled();
  });

  test("allows superuser role to access admin routes", async () => {
    mockDecode.mockResolvedValue({ role: "superuser" });
    await middleware(makeRequest("/admin/users", { "authjs.session-token": "tok" }));
    expect(mockNext).toHaveBeenCalled();
  });

  test("redirects to home when token decode fails", async () => {
    mockDecode.mockRejectedValue(new Error("bad token"));
    await middleware(makeRequest("/admin/users", { "authjs.session-token": "tok" }));
    expect(mockRedirect).toHaveBeenCalledWith("http://localhost:3100/");
  });
});
