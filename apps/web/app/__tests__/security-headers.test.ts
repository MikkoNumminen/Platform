import { securityHeaders, withSecurityHeaders } from "@/lib/security-headers";

describe("securityHeaders", () => {
  test("includes Content-Security-Policy", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp!.value).toContain("default-src 'self'");
    expect(csp!.value).toContain("frame-ancestors 'none'");
  });

  test("includes X-Content-Type-Options", () => {
    const header = securityHeaders.find((h) => h.key === "X-Content-Type-Options");
    expect(header).toBeDefined();
    expect(header!.value).toBe("nosniff");
  });

  test("includes X-Frame-Options", () => {
    const header = securityHeaders.find((h) => h.key === "X-Frame-Options");
    expect(header).toBeDefined();
    expect(header!.value).toBe("DENY");
  });

  test("includes Referrer-Policy", () => {
    const header = securityHeaders.find((h) => h.key === "Referrer-Policy");
    expect(header).toBeDefined();
    expect(header!.value).toBe("strict-origin-when-cross-origin");
  });

  test("includes Permissions-Policy", () => {
    const header = securityHeaders.find((h) => h.key === "Permissions-Policy");
    expect(header).toBeDefined();
    expect(header!.value).toContain("camera=()");
    expect(header!.value).toContain("microphone=()");
  });

  test("includes HSTS", () => {
    const header = securityHeaders.find((h) => h.key === "Strict-Transport-Security");
    expect(header).toBeDefined();
    expect(header!.value).toContain("max-age=63072000");
    expect(header!.value).toContain("includeSubDomains");
  });

  test("includes X-XSS-Protection", () => {
    const header = securityHeaders.find((h) => h.key === "X-XSS-Protection");
    expect(header).toBeDefined();
    expect(header!.value).toBe("1; mode=block");
  });

  test("CSP allows unsafe-inline for styles (MUI requirement)", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp!.value).toContain("style-src 'self' 'unsafe-inline'");
  });

  test("CSP does not include unsafe-eval in test/production", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp!.value).not.toContain("unsafe-eval");
  });

  test("CSP script-src includes unsafe-inline for Next.js hydration", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    const scriptSrc = csp!.value.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).toContain("'unsafe-inline'");
  });

  test("CSP restricts connect-src to specific OAuth domains", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp!.value).toContain("connect-src 'self'");
    expect(csp!.value).toContain("accounts.google.com");
    expect(csp!.value).toContain("api.github.com");
    // Should not allow blanket https: (no space after colon = scheme wildcard)
    expect(csp!.value).not.toMatch(/connect-src[^;]*\shttps:(?!\/)/);
  });

  test("CSP restricts img-src to OAuth avatar domains", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy");
    expect(csp!.value).toContain("lh3.googleusercontent.com");
    expect(csp!.value).toContain("avatars.githubusercontent.com");
  });
});

describe("withSecurityHeaders", () => {
  test("adds security headers to config", async () => {
    const config = withSecurityHeaders({ output: "standalone" });
    const headers = await config.headers!();
    expect(headers).toHaveLength(1);
    expect(headers[0].source).toBe("/(.*)");
    expect(headers[0].headers).toEqual(securityHeaders);
  });

  test("preserves existing headers", async () => {
    const existing = [{ source: "/api/(.*)", headers: [{ key: "X-Custom", value: "test" }] }];
    const config = withSecurityHeaders({
      async headers() {
        return existing;
      },
    });
    const headers = await config.headers!();
    expect(headers).toHaveLength(2);
    expect(headers[0]).toEqual(existing[0]);
  });

  test("preserves other config options", () => {
    const config = withSecurityHeaders({ output: "standalone" });
    expect(config.output).toBe("standalone");
  });
});
