import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
const root = fileURLToPath(new URL(".", import.meta.url));
const alias = { "@test": `${root}test`, "@": `${root}src` };
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.stories.*", "**/*.test.*", "**/testing.ts", "**/index.ts"],
      reporter: ["text-summary", "html", "json-summary"],
      thresholds: {
        "src/components/**": { lines: 80 },
        "src/shell/**": { lines: 80 },
        "src/shell/header-scroll.ts": { lines: 90 },
        "src/lib/**": { lines: 90 },
        "src/components/{internal,figure}.ts": { lines: 90 },
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          maxWorkers: 4,
          environment: "node",
          include: ["src/**/*.test.ts", "test/**/*.test.ts", "figma/**/*.test.{ts,mjs}"],
        },
      },
      {
        resolve: { alias },
        plugins: [react()],
        test: {
          name: "dom",
          maxWorkers: 4,
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./test/setup.ts"],
        },
      },
      {
        plugins: [storybookTest({ configDir: `${root}.storybook` })],
        test: {
          name: "stories",
          setupFiles: ["./.storybook/vitest.setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
