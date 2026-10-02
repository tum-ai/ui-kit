import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import js from "@eslint/js";
import react from "@eslint-react/eslint-plugin";
import prettier from "eslint-config-prettier";
import a11y from "eslint-plugin-jsx-a11y";
import jsdoc from "eslint-plugin-jsdoc";
import hooks from "eslint-plugin-react-hooks";
import sort from "eslint-plugin-simple-import-sort";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Published library source: everything under src except tests, stories and test helpers. */
const published = ["src/**/*.{ts,tsx}"];
const notPublished = ["**/*.test.*", "**/*.stories.*", "**/testing.ts"];

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
      ".claude/**",
      "examples/**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: {
          // Storybook config sits in a dot-folder that tsconfig globs skip.
          allowDefaultProject: [".storybook/*.ts", ".storybook/*.tsx"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  comments.recommended,
  {
    rules: {
      // A suppression must say why it is safe.
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: ["eslint-enable"] },
      ],
      "@eslint-community/eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...react.configs["strict-type-checked"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks, "jsx-a11y": a11y, "simple-import-sort": sort },
    settings: {
      // Lint the kit's link and button wrappers like the elements they render.
      "jsx-a11y": {
        components: {
          Anchor: "a",
          TextLink: "a",
          ButtonLink: "a",
          Button: "button",
          IconButton: "button",
        },
      },
    },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.strict.rules,
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // Props compose with intersections (`ComponentProps<"a"> & {…}`), so the kit uses types.
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      // `onClick={() => setOpen(false)}` is the idiomatic handler shape.
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
    },
  },
  {
    // An empty arrow is the idiomatic no-op callback.
    rules: { "@typescript-eslint/no-empty-function": ["error", { allow: ["arrowFunctions"] }] },
  },
  {
    // Test doubles and fixtures: stub methods and asserted lookups are expected here.
    files: [
      "**/*.test.*",
      "**/*.stories.*",
      "**/*.spec.*",
      "**/testing.ts",
      "test/**",
      "e2e/**",
      "figma/fixtures/**",
    ],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
    },
  },
  {
    files: published,
    ignores: notPublished,
    plugins: { jsdoc },
    settings: { jsdoc: { mode: "typescript" } },
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
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportAllDeclaration",
          message: "Use explicit named exports so the public API stays reviewable.",
        },
      ],
      // TSDoc on every export and every prop (docs/api.md and Storybook read it).
      "jsdoc/require-jsdoc": [
        "error",
        {
          // Selectors instead of `publicOnly`, which misses props inside intersections.
          require: { FunctionDeclaration: false },
          contexts: [
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportDefaultDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration:has(> VariableDeclaration)",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
            "ExportNamedDeclaration > TSInterfaceDeclaration",
            "ExportNamedDeclaration > TSEnumDeclaration",
            // Top-level props of an exported type, also inside `A & { … }`; members of
            // nested inline objects are described by their parent prop's comment.
            "ExportNamedDeclaration > TSTypeAliasDeclaration > TSTypeLiteral > TSPropertySignature",
            "ExportNamedDeclaration > TSTypeAliasDeclaration > TSIntersectionType > TSTypeLiteral > TSPropertySignature",
            "ExportNamedDeclaration > TSInterfaceDeclaration > TSInterfaceBody > TSPropertySignature",
          ],
        },
      ],
      "jsdoc/check-tag-names": [
        "error",
        { definedTags: ["remarks", "defaultValue", "privateRemarks", "packageDocumentation"] },
      ],
      "jsdoc/no-types": "error",
      "jsdoc/check-alignment": "error",
      "jsdoc/no-multi-asterisks": "error",
    },
  },
  {
    // These tests drive the plain-ESM build scripts (scripts/*.mjs), which have no types.
    files: ["test/figma-*.test.ts", "test/catalog.test.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
    },
  },
  {
    // The consumer example is checked by its own Next build, not the kit's tsconfig.
    files: ["**/*.{js,mjs,cjs}", "examples/**"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["examples/**/*.{ts,tsx}"],
    ...react.configs["disable-type-checked"],
  },
  ...storybook.configs["flat/recommended"],
  prettier,
);
