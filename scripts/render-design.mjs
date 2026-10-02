import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
const manifest = JSON.parse(await readFile("storybook-static/design/manifest.json", "utf8"));
const tokenManifest = JSON.parse(await readFile("storybook-static/design/tokens.json", "utf8"));
const server = spawn(process.execPath, ["scripts/serve.mjs", "storybook-static", "6012"], {
  stdio: "pipe",
});
await new Promise((resolve, reject) => {
  server.stdout.once("data", resolve);
  server.once("error", reject);
  server.once("exit", (code) => reject(new Error(`Renderer server exited ${code}`)));
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const previews = [];
  const candidates = [
    ...new Map(
      [...manifest.entries.flatMap((e) => e.stories), ...manifest.pages].map((s) => [s.id, s]),
    ).values(),
  ];
  const filter = process.env.DESIGN_STORIES?.split(",");
  const selected = filter ? candidates.filter((s) => filter.includes(s.id)) : candidates;
  if (!selected.length) throw new Error("No matching design stories");
  await mkdir("artifacts/design", { recursive: true });
  const tasks = selected.flatMap((story) =>
    (story.widths.length ? story.widths : manifest.referenceWidths).map((width) => ({
      story,
      width,
    })),
  );
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const capturePage = await browser.newPage({ reducedMotion: "reduce" });
      try {
        while (next < tasks.length) {
          const { story, width } = tasks[next++];
          await capturePage.setViewportSize({ width, height: 1000 });
          await capturePage.goto(`http://127.0.0.1:6012/iframe.html?id=${story.id}&viewMode=story`);
          await expect(capturePage.locator("body")).toHaveAttribute("data-kit-ready", "true", {
            timeout: 30000,
          });
          await capturePage.evaluate(() => window.scrollTo(0, 0));
          await capturePage.screenshot({
            path: `artifacts/design/${story.id}-${width}.png`,
            fullPage: true,
            animations: "disabled",
          });
          previews.push({ story: story.id, width, file: `${story.id}-${width}.png` });
          if (previews.length % 40 === 0)
            console.log(`Captured ${previews.length}/${tasks.length} previews`);
        }
      } finally {
        await capturePage.close();
      }
    }),
  );
  previews.sort((a, b) => a.story.localeCompare(b.story) || a.width - b.width);
  // Resolve tokens in a neutral specimen, independent of the last component's shell/tone.
  await page.goto(
    "http://127.0.0.1:6012/iframe.html?id=foundations-tones--all-tones&viewMode=story",
  );
  await expect(page.locator("body")).toHaveAttribute("data-kit-ready", "true");
  const resolved = [];
  for (const width of manifest.referenceWidths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const tone of ["paper", "mist", "lavender", "ink", "night", "violet"]) {
      const values = await page.evaluate(
        ({ tone, tokens }) => {
          const el = document.querySelector("#app-root");
          el?.setAttribute("data-tone", tone);
          const probe = document.createElement("span");
          probe.style.position = "absolute";
          (el ?? document.body).append(probe);
          const applicable = tokens.filter(
            (t) =>
              t.scope.startsWith("@theme") ||
              t.scope.includes(":root") ||
              t.scope === `[data-tone="${tone}"]`,
          );
          for (const token of applicable) probe.style.setProperty(token.name, token.value);
          const style = getComputedStyle(probe);
          const values = Object.fromEntries(
            [...new Set(applicable.map((t) => t.name))].map((name) => {
              const expression = applicable.findLast((t) => t.name === name)?.value;
              const raw = style.getPropertyValue(name).trim();
              let computed = raw;
              if (name.startsWith("--text-") && !name.includes("--", 2)) {
                probe.style.fontSize = `var(${name})`;
                computed = getComputedStyle(probe).fontSize;
              }
              if (
                name.startsWith("--radius-") ||
                ["--gutter", "--header-height", "--header-offset"].includes(name)
              ) {
                probe.style.width = `var(${name})`;
                computed = getComputedStyle(probe).width;
              }
              return [name, { expression, value: raw, resolved: computed }];
            }),
          );
          probe.remove();
          return values;
        },
        { tone, tokens: tokenManifest.tokens },
      );
      resolved.push({ width, tone, values });
    }
  }
  await writeFile(
    "artifacts/design/index.json",
    JSON.stringify(
      { schemaVersion: 1, source: manifest.source, previews, resolvedTokens: resolved },
      null,
      2,
    ),
  );
  console.log(`Exported ${previews.length} renders and ${resolved.length} token contexts.`);
} finally {
  await browser.close();
  server.kill();
}
