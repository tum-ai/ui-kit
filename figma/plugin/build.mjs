import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const target = JSON.parse(await readFile("design/figma.config.json", "utf8"));
const pluginId = process.env.FIGMA_PLUGIN_ID ?? target.pluginId;
if (!pluginId || !/^\d+$/.test(pluginId))
  throw new Error(
    "Set FIGMA_PLUGIN_ID to the ID Figma assigned when you registered this development/private plugin. Keep that ID stable for shared ledger access.",
  );
const destination = resolve(process.env.FIGMA_PLUGIN_OUTPUT ?? "artifacts/figma-plugin");
await mkdir(destination, { recursive: true });
const config = {
  fileKey: target.fileKey,
  repository: target.repository,
  package: pkg.name,
  pollIntervalMs: 300000,
};
try {
  config.seedLedger = JSON.parse(
    await readFile(process.env.FIGMA_SEED_LEDGER ?? "design/figma.seed.json", "utf8"),
  );
} catch (error) {
  if (process.env.FIGMA_SEED_LEDGER || error.code !== "ENOENT") throw error;
}
const result = spawnSync(
  "bun",
  [
    "build",
    "figma/plugin/entry.mjs",
    "--target=browser",
    "--format=iife",
    `--outfile=${destination}/code.js`,
    "--define",
    `__FIGMA_CONFIG__=${JSON.stringify(config)}`,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const manifest = JSON.parse(await readFile("figma/plugin/manifest.json", "utf8"));
manifest.id = pluginId;
await writeFile(`${destination}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
await copyFile("figma/plugin/ui.html", `${destination}/ui.html`);
console.log(
  `Figma plugin built at ${destination}. Import its manifest in Figma Desktop. Publishing a private plugin is a separate Figma action.`,
);
