import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env["CI"] ? 2 : 4,
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixels: 100, animations: "disabled" } },
  use: {
    baseURL: "http://127.0.0.1:6006",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "node scripts/serve.mjs storybook-static 6006",
    url: "http://127.0.0.1:6006",
    reuseExistingServer: !process.env["CI"],
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // The per-story motion audits run once, in Chromium (see e2e/motion.spec.ts).
    { name: "webkit", testIgnore: /motion\.spec\.ts/, use: { ...devices["Desktop Safari"] } },
    // Everything above runs with reduced motion; this project checks the motion itself.
    {
      name: "motion",
      testMatch: /motion\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], reducedMotion: "no-preference" },
    },
  ],
});
