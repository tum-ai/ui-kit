import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { validateScene } from "../figma/schema.mjs";
import { captureManifest } from "./figma/capture.mjs";
import { buildFoundations, resolveTokenContexts } from "./figma-tokens.mjs";
import { organizeLibrary } from "./figma-library.mjs";

/** The renderer exports data only. Figma imports it using checked-in plugin code. */
export async function buildFigma({
  baseUrl,
  output = "artifacts/figma",
  storyIds,
  diagnostic = false,
}) {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const manifest = JSON.parse(await readFile("storybook-static/design/manifest.json", "utf8"));
  const tokens = JSON.parse(await readFile("storybook-static/design/tokens.json", "utf8"));
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = !!execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
  if (process.env.CI && dirty) throw new Error("Release generation requires a clean checkout");
  const release = { version: pkg.version, commit };
  if (manifest.package !== pkg.name)
    throw new Error("Stale package manifest: run bun run manifests");
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch();
  let scene, contexts;
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    contexts = await resolveTokenContexts(page, tokens, { baseUrl });
    await page.close();
    const foundations = buildFoundations(contexts);
    scene = await captureManifest({
      manifest,
      baseUrl,
      release,
      storyIds,
      browser,
      tokenNames: [...new Set(tokens.tokens.map((t) => t.name))],
      variableKeys: new Set(foundations.variables.map((v) => v.key)),
      screenshotDirectory: path.join(output, "previews"),
      onProgress: ({ done, total }) => {
        if (done % 20 === 0 || done === total) console.log(`Figma capture ${done}/${total}`);
      },
    });
    Object.assign(scene, foundations);
    scene.source = {
      ...scene.source,
      repository: "tum-ai/ui-kit",
      extraction: manifest.source,
      dirtyCheckout: dirty,
      completeInventory: !storyIds,
      tokens: { declarations: tokens.tokens, contexts },
    };
    organizeLibrary(scene);
    validateScene({ ...scene, diagnostics: [] });
  } finally {
    await browser.close();
  }
  const errors = scene.diagnostics.filter((d) => d.severity === "error");
  await writeFile(
    path.join(output, "figma-diagnostics.json"),
    JSON.stringify({ release, errors: errors.length, diagnostics: scene.diagnostics }, null, 2) +
      "\n",
  );
  const bytes = JSON.stringify(scene) + "\n";
  const digest = createHash("sha256").update(bytes).digest("hex");
  // A diagnostic capture is intentionally ineligible for the plugin's release asset name.
  const name = errors.length ? "figma-scene.diagnostic.json" : "figma-scene.json";
  await writeFile(path.join(output, name), bytes);
  await writeFile(path.join(output, `${name}.sha256`), `${digest}  ${name}\n`);
  await writeFile(
    path.join(output, "figma-inventory.json"),
    JSON.stringify(
      {
        release,
        package: pkg.name,
        digest,
        complete: !storyIds && !errors.length,
        stories: scene.source.inventory,
        components: manifest.entries,
        tokenContexts: contexts.length,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Wrote ${name}: ${scene.source.captures.length} stories; ${errors.length} fidelity errors; SHA-256 ${digest}`,
  );
  if (errors.length && !diagnostic)
    throw new Error(
      "Figma scene has fidelity errors; no importable release asset produced. See figma-diagnostics.json.",
    );
  return { scene, output, digest };
}

async function main() {
  const args = process.argv.slice(2);
  const option = (flag, fallback) =>
    args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
  let server;
  let baseUrl = option("--base-url", process.env.STORYBOOK_BASE_URL);
  try {
    if (!baseUrl) {
      server = spawn(process.execPath, ["scripts/serve.mjs", "storybook-static", "6014"], {
        stdio: ["ignore", "pipe", "inherit"],
      });
      await new Promise((resolve, reject) => {
        server.stdout.once("data", resolve);
        server.once("error", reject);
        server.once("exit", (code) => reject(new Error(`Figma render server exited ${code}`)));
      });
      baseUrl = "http://127.0.0.1:6014";
    }
    await buildFigma({
      baseUrl,
      output: option("--output", "artifacts/figma"),
      storyIds: option("--stories", process.env.FIGMA_STORIES)?.split(",").filter(Boolean),
      diagnostic: args.includes("--diagnostic"),
    });
  } finally {
    server?.kill();
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
