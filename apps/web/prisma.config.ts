import path from "node:path";
import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

// Load .env.local (Next.js convention) for DATABASE_URL
try {
  loadEnvFile(path.resolve(__dirname, ".env.local"));
} catch {
  // .env.local may not exist in CI
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
