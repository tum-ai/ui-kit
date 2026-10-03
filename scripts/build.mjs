import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
await rm("dist", { recursive: true, force: true });
execFileSync("node", ["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"], {
  stdio: "inherit",
});
// TypeScript preserves module boundaries and client directives. Make emitted relative imports valid ESM.
async function fix(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await fix(p);
    else if (/\.(js|ts)$/.test(p)) {
      let s = await readFile(p, "utf8");
      s = s.replace(/((?:from\s*|import\s*\(?\s*)["'])(\.\.?\/[^"']+)(["'])/g, (all, a, b, c) =>
        /\.[a-z]+$/.test(b) ? all : `${a}${b}.js${c}`,
      );
      await writeFile(p, s);
    }
  }
}
await fix("dist");
await mkdir("dist/styles", { recursive: true });
await cp("src/styles", "dist/styles", { recursive: true });
