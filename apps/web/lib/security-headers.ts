import type { NextConfig } from "next";

type Header = { key: string; value: string };

const isDev = process.env.NODE_ENV === "development";

export const securityHeaders: Header[] = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' only in dev (Next.js HMR); 'unsafe-inline' required by Next.js for inline hydration scripts
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      // 'unsafe-inline' required by MUI emotion CSS-in-JS style injection
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://github.com https://api.github.com",
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
