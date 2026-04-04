import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSecurityHeaders } from "./lib/security-headers";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = withSecurityHeaders({
  redirects: async () => [
    {
      source: "/admin/gamification/:path*",
      destination: "/admin/dashboard/:path*",
      permanent: true,
    },
    {
      source: "/admin/gamification",
      destination: "/admin/dashboard",
      permanent: true,
    },
  ],
});

export default withNextIntl(nextConfig);
