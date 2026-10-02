# Ad hoc Playwright sweep

Use this for screenshots at widths or states the E2E specs don't cover. Checks that should keep running belong in `e2e/explorer.spec.ts` instead.

Save the script as `test-results/ui-verify.mjs`. `test-results/` is gitignored, and a file inside the repository resolves `@playwright/test` from `node_modules`. Start Storybook first, with `bun run dev` or a static build served by `node scripts/serve.mjs storybook-static 6006`. Then pass story IDs, which are the `?path=/story/<id>` part of the Storybook URL:

```bash
node test-results/ui-verify.mjs patterns-complete-page--default interactions-dialog--medium
BASE_URL=https://<preview-url> node test-results/ui-verify.mjs foundations-tones--all-tones
```

Screenshots land in `test-results/ui-verify/<story>-<browser>-<width>[-reduced].png`.

```js
import { mkdirSync } from "node:fs";
import { chromium, webkit } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:6006";
const stories =
  process.argv.length > 2 ? process.argv.slice(2) : ["patterns-complete-page--default"];
const widths = [320, 390, 768, 1024, 1440];
const out = "test-results/ui-verify";
mkdirSync(out, { recursive: true });

for (const [browserName, browserType] of [
  ["chromium", chromium],
  ["webkit", webkit],
]) {
  const browser = await browserType.launch();
  for (const reducedMotion of ["no-preference", "reduce"]) {
    for (const width of widths) {
      for (const id of stories) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
        // Stories set data-kit-ready after their play function and fonts settle.
        await page.locator('body[data-kit-ready="true"]').waitFor();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        const suffix = reducedMotion === "reduce" ? "-reduced" : "";
        await page.screenshot({
          path: `${out}/${id}-${browserName}-${width}${suffix}.png`,
          fullPage: true,
        });
        const status = overflow > 0 || errors.length > 0 ? "CHECK" : "ok";
        console.log(
          `${status} ${browserName} ${width}px ${reducedMotion} ${id}: overflow ${overflow}px, ${errors.length} console errors`,
        );
        for (const error of errors) console.log(`  ${error}`);
        await page.close();
      }
    }
  }
  await browser.close();
}
```

Any `CHECK` line needs a look. It means horizontal overflow at that width, or a console error such as a hydration mismatch.
