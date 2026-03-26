import type { NextConfig } from "next";

type Header = { key: string; value: string };

export const securityHeaders: Header[] = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-eval' in dev; MUI requires 'unsafe-inline' for styles
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

export function withSecurityHeaders(config: NextConfig): NextConfig {
  return {
    ...config,
    async headers() {
      const existing = config.headers ? await config.headers() : [];
      return [
        ...existing,
        {
          source: "/(.*)",
          headers: securityHeaders,
        },
      ];
    },
  };
}
