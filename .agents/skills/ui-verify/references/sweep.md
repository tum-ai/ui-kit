# Ad hoc Playwright sweep

For screenshots at widths or states the E2E specs don't cover, run locally by a person (agents
rely on CI; see the skill). Checks that should keep running belong in `e2e/` instead, using the
helpers in `e2e/fixtures.ts`.

Save the script as `test-results/ui-verify.mjs`. `test-results/` is gitignored, and a file inside
the repo resolves `@playwright/test` from `node_modules`. With the production server from step 1
running:

```bash
node test-results/ui-verify.mjs /partners /events     # routes to check (default: /)
BASE_URL=https://<preview-url> node test-results/ui-verify.mjs /   # or a Vercel preview
```

Screenshots land in `test-results/ui-verify/<route>-<browser>-<width>[-reduced].png`.

```js
import { mkdirSync } from "node:fs";
import { chromium, webkit } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const routes = process.argv.length > 2 ? process.argv.slice(2) : ["/"];
const widths = [320, 390, 768, 1024, 1440];
const out = "test-results/ui-verify";
mkdirSync(out, { recursive: true });

// Scroll through the page so below-the-fold <Reveal> content is revealed
// before the full-page screenshot, then return to the top.
async function revealAll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1300); // longest entrance is 1.2 s
}

for (const [browserName, browserType] of [
  ["chromium", chromium],
  ["webkit", webkit],
]) {
  const browser = await browserType.launch();
  for (const reducedMotion of ["no-preference", "reduce"]) {
    for (const width of widths) {
      for (const route of routes) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
        await revealAll(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
        const suffix = reducedMotion === "reduce" ? "-reduced" : "";
        await page.screenshot({
          path: `${out}/${slug}-${browserName}-${width}${suffix}.png`,
          fullPage: true,
        });
        const status = overflow > 0 || errors.length > 0 ? "CHECK" : "ok";
        console.log(
          `${status} ${browserName} ${width}px ${reducedMotion} ${route}: overflow ${overflow}px, ${errors.length} console errors`,
        );
        for (const error of errors) console.log(`  ${error}`);
        await page.close();
      }
    }
  }
  await browser.close();
}
```

Any `CHECK` line needs a look: horizontal overflow at a width, or a console error (hydration
mismatches show up here).
