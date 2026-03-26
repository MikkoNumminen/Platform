import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

import testingLibrary from "eslint-plugin-testing-library";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  ...tseslint.configs.recommended,
  nextPlugin.configs["core-web-vitals"],

  testingLibrary.configs["flat/react"],
  prettierConfig,
  {
    ignores: ["node_modules/", ".next/", "__mocks__/", "coverage/", "next-env.d.ts"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

    },
  },
];

export default eslintConfig;
