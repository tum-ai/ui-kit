import { cp, mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const root = process.cwd();
execFileSync("bun", ["run", "build"], { stdio: "inherit" });
await mkdir("artifacts", { recursive: true });
const result = JSON.parse(
  execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", "artifacts"], {
    encoding: "utf8",
  }),
)[0];
const files = result.files.map((f) => f.path);
const excluded = files.filter((f) =>
  /(?:\.stories\.|\.test\.|(?:^|\/)testing\.|(?:^|\/)\.(?:claude|agents)\/)/.test(f),
);
if (excluded.length)
  throw new Error(`Development files leaked into tarball: ${excluded.join(", ")}`);
const archive = path.join(root, "artifacts", result.filename);
const dir = await mkdtemp(path.join(tmpdir(), "tumai-ui-consumer-"));
await cp("examples/next-consumer", dir, { recursive: true });
const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
pkg.dependencies["@tum-ai/ui-kit"] = `file:${archive}`;
await writeFile(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2));
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", CI: "1" };
execFileSync("bun", ["install"], { cwd: dir, stdio: "inherit", env });
await mkdir(path.join(dir, "public"), { recursive: true });
for (const [source, dest] of [
  ["placeholder.svg", "placeholder.svg"],
  ["tum_ai_logo_new.svg", "logo.svg"],
])
  await cp(
    path.join(dir, "node_modules/@tum-ai/ui-kit/assets", source),
    path.join(dir, "public", dest),
  );
execFileSync("bun", ["run", "build"], { cwd: dir, stdio: "inherit", env });
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
  { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
server.stdout.on("data", (b) => {
  output += b;
});
server.stderr.on("data", (b) => {
  output += b;
});
const url = `http://127.0.0.1:${port}`;
let browser;
try {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(output);
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* The server may still be binding its port. */
    }
    if (i === 119) throw new Error(`Consumer did not start: ${output}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  await context.route("https://fixture.invalid/**", (route) =>
    route.fulfill({ path: path.join(dir, "public/placeholder.svg"), contentType: "image/svg+xml" }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /hydration|did not match|server rendered/i.test(m.text()))
      errors.push(m.text());
  });
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Package consumer" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Clicked 0 times" }).click();
  await expect(page.getByRole("button", { name: "Clicked 1 times" })).toBeVisible();
  await expect(page.getByText("Image fallback is visible.")).toBeVisible();
  for (const alt of ["Local geometric illustration", "Remote geometric illustration"])
    await expect
      .poll(() =>
        page.getByAltText(alt).evaluate((image) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  await expect(page.getByAltText("Remote geometric illustration")).toHaveAttribute(
    "src",
    "https://fixture.invalid/artwork.svg",
  );
  const style = await page.getByTestId("variant-primary").evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      display: s.display,
      height: s.height,
      font: s.fontFamily,
    };
  });
  expect(style).toMatchObject({
    background: "rgb(128, 82, 194)",
    display: "inline-flex",
    height: "44px",
  });
  expect(style.font).toContain("Manrope");
  expect(
    await page.getByTestId("variant-outline").evaluate((el) => getComputedStyle(el).borderTopWidth),
  ).toBe("1px");
  await expect(page.getByTestId("progressive-content")).toHaveCSS("opacity", "1");
  const trigger = page.getByRole("button", { name: "Open package dialog" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Package dialog" });
  await expect(dialog).toBeVisible();
  expect(await page.locator("#app-root").evaluate((el) => el.inert)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.locator("#app-root").evaluate((el) => el.inert)).toBe(false);
  await page.getByRole("button", { name: "Does the package hydrate?" }).click();
  await expect(page.getByText("Yes, interactive primitives work from the tarball.")).toBeVisible();
  await page.getByRole("link", { name: "Visit the second route" }).click();
  await expect(page.getByRole("heading", { name: "Second route" })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("link", { name: "About", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await menu.getByRole("link", { name: "Home", exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("heading", { name: "Package consumer" })).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: "artifacts/consumer.png", fullPage: true });
  await context.tracing.stop({ path: "artifacts/consumer-trace.zip" });
  const nojs = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const serverPage = await nojs.newPage();
  await serverPage.goto(url);
  await expect(serverPage.getByText("This content is visible without JavaScript.")).toBeVisible();
  await expect(serverPage.getByTestId("count")).toContainText("120");
  await expect(serverPage.getByRole("contentinfo")).toContainText("Built from the packed library.");
  await nojs.close();
  await writeFile(
    "artifacts/consumer.json",
    JSON.stringify(
      {
        directory: dir,
        archive,
        files,
        checks: [
          "production build",
          "server render",
          "hydration",
          "CSS scanning",
          "fonts",
          "local and remote images",
          "fallback",
          "dialog portal and axe",
          "routing and mobile menu",
          "no JavaScript",
          "reduced motion",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Packed consumer build and browser checks passed at ${dir}`);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
