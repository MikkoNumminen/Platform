import type { NextConfig } from "next";
import { withSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = withSecurityHeaders({});

export default nextConfig;
