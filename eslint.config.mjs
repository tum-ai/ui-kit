import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import storybook from "eslint-plugin-storybook";
import sort from "eslint-plugin-simple-import-sort";
import prettier from "eslint-config-prettier";
import globals from "globals";
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "storybook-static/**",
      "coverage/**",
      "artifacts/**",
      "test-results/**",
      "playwright-report/**",
      ".consumer/**",
      "examples/**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks, "jsx-a11y": a11y, "simple-import-sort": sort },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.*", "**/*.stories.*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "@test/*", "**/features/**", "**/config/**", "sanity", "next-sanity"],
              message:
                "Published code must use relative library imports and receive application data as props.",
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
  prettier,
);
