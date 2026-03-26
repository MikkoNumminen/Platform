import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  ...tseslint.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  jestDom.configs["flat/recommended"],
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
      // Disable rule incompatible with ESLint 10 (uses removed context.getSourceCode API)
      "jest-dom/prefer-to-have-class": "off",
    },
  },
];

export default eslintConfig;
