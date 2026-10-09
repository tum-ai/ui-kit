import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";

// Retry uploads without mutating an existing asset. Capture output is deterministic;
// a mismatch needs inspection, never an implicit --clobber.
const [tag, ...paths] = process.argv.slice(2);
if (!/^v\d+\.\d+\.\d+$/.test(tag ?? "") || !paths.length)
  throw new Error("Usage: node scripts/upload-release-assets.mjs v<version> <file>...");
const release = JSON.parse(
  execFileSync("gh", ["api", `repos/tum-ai/ui-kit/releases/tags/${tag}`], { encoding: "utf8" }),
);
if (release.draft || release.prerelease) throw new Error("A stable release is required");
const pending = [];
for (const path of paths) {
  const bytes = await readFile(path);
  const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  const existing = release.assets.find((asset) => asset.name === basename(path));
  if (existing && (existing.digest !== digest || existing.size !== bytes.length))
    throw new Error(
      `Refusing to replace published asset ${basename(path)}; recover from the original release files`,
    );
  if (!existing) pending.push(path);
}
for (const path of pending)
  execFileSync("gh", ["release", "upload", tag, path, "--repo", "tum-ai/ui-kit"], {
    stdio: "inherit",
  });
console.log(
  `${pending.length} assets uploaded; ${paths.length - pending.length} identical published assets reused`,
);
