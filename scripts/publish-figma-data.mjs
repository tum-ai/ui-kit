import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const repository = "tum-ai/ui-kit";
const branch = "figma-release-data";
const names = ["figma-scene.json", "figma-scene.json.sha256"];
const digest = (value) => createHash("sha256").update(value).digest("hex");
const blobId = (value) =>
  createHash("sha1")
    .update(`blob ${Buffer.byteLength(value)}\0`)
    .update(value)
    .digest("hex");

/** Publish byte-identical release assets through GitHub's CORS-enabled raw endpoint.
 * Existing version paths are immutable. A non-fast-forward ref update fails safely;
 * rerunning reuses matching data or creates a new commit on the current branch head.
 */
export async function publishReleaseData({ release, files, api }) {
  if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name))
    throw new Error("A published stable v<version> release is required");
  for (const name of names) {
    const asset = release.assets?.find((entry) => entry.name === name);
    const value = files[name];
    if (
      typeof value !== "string" ||
      !asset ||
      asset.size !== Buffer.byteLength(value) ||
      asset.digest !== `sha256:${digest(value)}`
    )
      throw new Error(`Local ${name} does not match the published release asset`);
  }
  if (
    Buffer.byteLength(files[names[0]]) > 30 * 1024 * 1024 ||
    Buffer.byteLength(files[names[1]]) > 512 ||
    files[names[1]].trim().split(/\s+/)[0] !== digest(files[names[0]])
  )
    throw new Error("Invalid release scene size or checksum");
  const scene = JSON.parse(files[names[0]]);
  if (
    scene.package !== "@tum.ai/ui-kit" ||
    release.tag_name !== `v${scene.release?.version}` ||
    !/^[a-f0-9]{40}$/.test(scene.release?.commit ?? "") ||
    scene.source?.repository !== repository ||
    scene.source?.dirtyCheckout !== false ||
    scene.source?.completeInventory !== true
  )
    throw new Error("Invalid release scene identity");
  const source = await api("GET", `/commits/${release.tag_name}`);
  if (source.sha !== scene.release.commit)
    throw new Error("Release tag does not match scene commit");
  const current = await api("GET", `/git/ref/heads/${branch}`, undefined, true);
  const parent = current?.object?.sha;
  const commit = parent ? await api("GET", `/git/commits/${parent}`) : null;
  const tree = commit
    ? await api("GET", `/git/trees/${commit.tree.sha}?recursive=1`)
    : { tree: [] };
  if (tree.truncated) throw new Error("Release data tree is too large to verify");
  const entries = names.map((name) => ({
    path: `releases/${release.tag_name}/${name}`,
    mode: "100644",
    type: "blob",
    sha: blobId(files[name]),
  }));
  const existing = entries.map((entry) => tree.tree.find((item) => item.path === entry.path));
  if (existing.some(Boolean)) {
    if (!entries.every((entry, index) => existing[index]?.sha === entry.sha))
      throw new Error("Refusing to replace an existing release data directory");
    return { commit: parent, unchanged: true };
  }
  for (const [index, name] of names.entries()) {
    const blob = await api("POST", "/git/blobs", { content: files[name], encoding: "utf-8" });
    if (blob.sha !== entries[index].sha) throw new Error("GitHub blob identity mismatch");
  }
  const nextTree = await api("POST", "/git/trees", {
    ...(commit ? { base_tree: commit.tree.sha } : {}),
    tree: entries,
  });
  const next = await api("POST", "/git/commits", {
    message: `chore(figma): publish ${release.tag_name} release data`,
    author: { name: "Justin Lanfermann", email: "Justin@Lanfermann.dev" },
    tree: nextTree.sha,
    parents: parent ? [parent] : [],
  });
  if (parent) await api("PATCH", `/git/refs/heads/${branch}`, { sha: next.sha, force: false });
  else await api("POST", "/git/refs", { ref: `refs/heads/${branch}`, sha: next.sha });
  return { commit: next.sha, unchanged: false };
}

function github(method, path, body, allowMissing = false) {
  const result = spawnSync(
    "gh",
    ["api", `repos/${repository}${path}`, "--method", method, ...(body ? ["--input", "-"] : [])],
    {
      input: body ? JSON.stringify(body) : undefined,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    if (allowMissing && result.stderr.includes("HTTP 404")) return null;
    throw new Error(result.stderr || result.error?.message || "GitHub API request failed");
  }
  return JSON.parse(result.stdout);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [tag, directory] = process.argv.slice(2);
  if (!/^v\d+\.\d+\.\d+$/.test(tag ?? "") || !directory)
    throw new Error("Usage: node scripts/publish-figma-data.mjs v<version> <artifact-directory>");
  const release = github("GET", `/releases/tags/${tag}`);
  const files = Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [name, await readFile(resolve(directory, name), "utf8")]),
    ),
  );
  console.log(JSON.stringify(await publishReleaseData({ release, files, api: github })));
}
