import type { NextConfig } from "next";
import { withSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = withSecurityHeaders({
  output: "standalone",
});

export default nextConfig;
