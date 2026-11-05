import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "vitest";
import { publishReleaseData } from "../scripts/publish-figma-data.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const blobId = (value) =>
  createHash("sha1")
    .update(`blob ${Buffer.byteLength(value)}\0`)
    .update(value)
    .digest("hex");
function fixture() {
  const raw = JSON.stringify({
    package: "@tum.ai/ui-kit",
    release: { version: "0.1.0", commit: "a".repeat(40) },
    source: { repository: "tum-ai/ui-kit", completeInventory: true, dirtyCheckout: false },
  });
  const files = {
    "figma-scene.json": raw,
    "figma-scene.json.sha256": `${hash(raw)}  figma-scene.json\n`,
  };
  const release = {
    tag_name: "v0.1.0",
    assets: Object.entries(files).map(([name, content]) => ({
      name,
      size: Buffer.byteLength(content),
      digest: `sha256:${hash(content)}`,
    })),
  };
  let current = null;
  let tree = [];
  const calls = [];
  const api = async (method, path, body) => {
    calls.push({ method, path, body });
    if (path.startsWith("/commits/")) return { sha: "a".repeat(40) };
    if (path === "/git/ref/heads/figma-release-data")
      return current ? { object: { sha: current } } : null;
    if (path === "/git/commits/current") return { tree: { sha: "tree" } };
    if (path === "/git/trees/tree?recursive=1") return { tree };
    if (path === "/git/blobs") return { sha: blobId(body.content) };
    if (path === "/git/trees") {
      tree = [...tree, ...body.tree];
      return { sha: "tree" };
    }
    if (path === "/git/commits") return { sha: "current" };
    if (path === "/git/refs" || path === "/git/refs/heads/figma-release-data") {
      current = body.sha;
      return {};
    }
    throw Error(`Unexpected request ${path}`);
  };
  return { release, files, api, calls };
}

test("release data commits both assets atomically and an identical rerun is read-only", async () => {
  const f = fixture();
  assert.deepEqual(await publishReleaseData(f), { commit: "current", unchanged: false });
  assert.equal(f.calls.filter((c) => c.path === "/git/trees")[0].body.tree.length, 2);
  assert.equal(f.calls.at(-1).path, "/git/refs");
  f.calls.length = 0;
  assert.deepEqual(await publishReleaseData(f), { commit: "current", unchanged: true });
  assert.ok(f.calls.every((c) => c.method === "GET"));
});

test("release data rejects corruption before requests and different existing version bytes before writes", async () => {
  const f = fixture();
  const raw = f.files["figma-scene.json"];
  f.files["figma-scene.json"] += " ";
  await assert.rejects(publishReleaseData(f), /does not match/);
  assert.equal(f.calls.length, 0);
  f.files["figma-scene.json"] = raw;
  await publishReleaseData(f);
  f.calls.length = 0;
  f.files["figma-scene.json"] += " ";
  f.files["figma-scene.json.sha256"] = `${hash(f.files["figma-scene.json"])}  figma-scene.json\n`;
  for (const asset of f.release.assets) {
    asset.size = Buffer.byteLength(f.files[asset.name]);
    asset.digest = `sha256:${hash(f.files[asset.name])}`;
  }
  await assert.rejects(publishReleaseData(f), /Refusing to replace/);
  assert.ok(f.calls.every((c) => c.method === "GET"));
});

test("a later release advances the data branch without force and propagates concurrent update failure", async () => {
  const f = fixture();
  await publishReleaseData(f);
  f.calls.length = 0;
  f.release.tag_name = "v0.2.0";
  f.files["figma-scene.json"] = f.files["figma-scene.json"].replace("0.1.0", "0.2.0");
  f.files["figma-scene.json.sha256"] = `${hash(f.files["figma-scene.json"])}  figma-scene.json\n`;
  for (const asset of f.release.assets) {
    asset.size = Buffer.byteLength(f.files[asset.name]);
    asset.digest = `sha256:${hash(f.files[asset.name])}`;
  }
  const original = f.api;
  f.api = async (method, path, body) => {
    if (method === "PATCH") {
      assert.equal(body.force, false);
      throw Error("Non-fast-forward");
    }
    return original(method, path, body);
  };
  await assert.rejects(publishReleaseData(f), /Non-fast-forward/);
});
