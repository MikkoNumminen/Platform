import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  collectCoverageFrom: ["app/**/*.{ts,tsx}", "!app/**/*.d.ts", "!app/**/layout.tsx"],
};

export default createJestConfig(config);
