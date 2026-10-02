import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "vitest";
import { fakeFigma } from "./fixtures/fake-figma.mjs";
import { pilotScene } from "./fixtures/pilot.mjs";
import { sha256 } from "./hash.mjs";
import { createPluginController } from "./plugin/controller.mjs";
import { documentStore } from "./plugin/storage.mjs";

function setup() {
  const figma = fakeFigma("realfile");
  const data = new Map();
  figma.root.getPluginData = (key) => data.get(key) ?? "";
  figma.root.setPluginData = (key, value) => {
    if (value) data.set(key, value);
    else data.delete(key);
  };
  const scene = pilotScene();
  scene.release = { version: "0.1.0", commit: "a".repeat(40) };
  scene.source = { completeInventory: true, repository: "tum-ai/ui-kit", dirtyCheckout: false };
  const config = { fileKey: figma.fileKey, package: scene.package, repository: "tum-ai/ui-kit" };
  const raw = JSON.stringify(scene),
    checksum = sha256(raw);
  const metadata = {
    id: 1,
    tag_name: "v0.1.0",
    published_at: "2026-10-02T00:00:00Z",
    draft: false,
    prerelease: false,
    assets: [
      {
        name: "figma-scene.json",
        size: raw.length,
        browser_download_url:
          "https://github.com/tum-ai/ui-kit/releases/download/v0.1.0/figma-scene.json",
      },
      {
        name: "figma-scene.json.sha256",
        size: 64,
        browser_download_url:
          "https://github.com/tum-ai/ui-kit/releases/download/v0.1.0/figma-scene.json.sha256",
      },
    ],
  };
  const fetch = async (url) => ({
    ok: true,
    status: 200,
    json: async () =>
      url.endsWith("latest")
        ? metadata
        : url.includes("/releases?")
          ? []
          : { sha: scene.release.commit },
    text: async () => (url.endsWith("sha256") ? checksum : raw),
  });
  const messages = [];
  const dependencies = {
    fetch,
    sleep: async () => {},
    report: (message) => messages.push(message),
  };
  return { figma, data, config, scene, metadata, dependencies, messages };
}

test("portable SHA-256 matches Node for Unicode and multiblock payloads", () => {
  for (const value of ["", "abc", "TUM.ai 🙂 ä", "a".repeat(100000)])
    assert.equal(sha256(value), createHash("sha256").update(value).digest("hex"));
});

test("document checkpoints are shared and failed chunk writes leave the previous head readable", () => {
  const { figma, data } = setup();
  const store = documentStore(figma.root);
  store.save({ value: "old" });
  const head = data.get("tumai.release-sync.v1.head");
  const write = figma.root.setPluginData;
  let blobs = 0;
  figma.root.setPluginData = (key, value) => {
    if (key.includes(".blob.") && ++blobs === 2) throw Error("Interrupted");
    write(key, value);
  };
  assert.throws(() => store.save({ value: "x".repeat(50000) }), /Interrupted/);
  assert.equal(data.get("tumai.release-sync.v1.head"), head);
  assert.deepEqual(store.load(), { value: "old" });
});

test("native plugin syncs verified release data and replays unchanged across collaborator sessions", async () => {
  const fixture = setup();
  const first = createPluginController(fixture.figma, fixture.config, fixture.dependencies);
  assert.equal((await first.syncOnce()).ok, true);
  const second = createPluginController(fixture.figma, fixture.config, fixture.dependencies);
  const replay = await second.syncOnce();
  assert.equal(replay.ok, true);
  assert.equal(replay.changedNodes, 0);
  assert.equal(documentStore(fixture.figma.root).load().release.id, 1);
});

test("plugin rejects a different file, incomplete inventory, checksum mismatch and concurrent lease", async () => {
  const wrong = setup();
  wrong.figma.fileKey = "another";
  assert.match(
    (await createPluginController(wrong.figma, wrong.config, wrong.dependencies).syncOnce()).error,
    /unverified file/,
  );
  const checksum = setup();
  const original = checksum.dependencies.fetch;
  checksum.dependencies.fetch = async (url) =>
    url.endsWith("sha256") ? { ok: true, text: async () => "0".repeat(64) } : original(url);
  assert.match(
    (
      await createPluginController(
        checksum.figma,
        checksum.config,
        checksum.dependencies,
      ).syncOnce()
    ).error,
    /checksum mismatch/,
  );
  assert.equal(checksum.figma.writes, 0);
  const concurrent = setup();
  documentStore(concurrent.figma.root).write("lease", {
    owner: "another-user",
    expiresAt: Date.now() + 60000,
  });
  assert.match(
    (
      await createPluginController(
        concurrent.figma,
        concurrent.config,
        concurrent.dependencies,
      ).syncOnce()
    ).error,
    /collaborator/,
  );
  assert.equal(concurrent.figma.writes, 0);
});

test("unknown outcomes pause automatic retry and imported state cannot claim an unverified release", async () => {
  const fixture = setup();
  const store = documentStore(fixture.figma.root);
  const controller = createPluginController(fixture.figma, fixture.config, fixture.dependencies);
  await controller.syncOnce();
  const exported = controller.exportState();
  store.write("pending", { batchKey: "test" });
  assert.match((await controller.syncOnce()).error, /previous sync ended/);
  exported.release = { id: 999, sceneSha256: "fabricated" };
  await controller.importState(exported);
  assert.equal(store.load().release, null);
  assert.equal(store.read("pending"), null);
  assert.equal((await controller.syncOnce()).ok, true);
});

test("final release checkpoint interruption resumes without repeating canvas writes", async () => {
  const fixture = setup();
  const original = fixture.figma.root.setPluginData;
  let heads = 0;
  fixture.figma.root.setPluginData = (key, value) => {
    if (key.endsWith(".head") && ++heads === 3) throw Error("Interrupted final checkpoint");
    original(key, value);
  };
  const first = await createPluginController(
    fixture.figma,
    fixture.config,
    fixture.dependencies,
  ).syncOnce();
  assert.equal(first.ok, false);
  fixture.figma.root.setPluginData = original;
  const resumed = await createPluginController(
    fixture.figma,
    fixture.config,
    fixture.dependencies,
  ).syncOnce();
  assert.equal(resumed.ok, true);
  assert.equal(resumed.changedNodes, 0);
});

test("same-release polling checks native drift instead of trusting imported or previous release IDs", async () => {
  const fixture = setup();
  const controller = createPluginController(fixture.figma, fixture.config, fixture.dependencies);
  await controller.syncOnce();
  const ledger = controller.exportState().ledger;
  fixture.figma.snapshot().nodes.get(ledger.entities["pilot/button/Primary/label"].id).characters =
    "Changed generated text";
  const retry = await controller.syncOnce();
  assert.match(retry.error, /native content drifted/);
});

test("recovery import is exclusive with polling and other imports", async () => {
  const fixture = setup();
  const controller = createPluginController(fixture.figma, fixture.config, fixture.dependencies);
  await controller.syncOnce();
  const exported = controller.exportState();
  const lookup = fixture.figma.getNodeByIdAsync;
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  let first = true;
  fixture.figma.getNodeByIdAsync = async (id) => {
    if (first) {
      first = false;
      await blocked;
    }
    return lookup(id);
  };
  const importing = controller.importState(exported);
  assert.deepEqual(await controller.syncOnce(), { skipped: "running" });
  await assert.rejects(controller.importState(exported), /current sync/);
  release();
  await importing;
  assert.equal((await controller.syncOnce()).ok, true);
});

test("first launch waits without writes when the repository has no releases, then catches up", async () => {
  const fixture = setup();
  const original = fixture.dependencies.fetch;
  let published = false;
  fixture.dependencies.fetch = async (url) =>
    !published && url.endsWith("/releases/latest") ? { ok: false, status: 404 } : original(url);
  const controller = createPluginController(fixture.figma, fixture.config, fixture.dependencies);
  assert.deepEqual(await controller.syncOnce(), { waiting: "first-release" });
  assert.equal(fixture.messages.at(-1).phase, "waiting");
  assert.equal(fixture.figma.writes, 0);
  assert.equal(fixture.data.size, 0);
  published = true;
  assert.equal((await controller.syncOnce()).ok, true);
});

test("missing repository and failed release requests remain errors, not first-release waits", async () => {
  for (const status of [404, 403, 500]) {
    const fixture = setup();
    fixture.dependencies.fetch = async () => ({ ok: false, status });
    const result = await createPluginController(
      fixture.figma,
      fixture.config,
      fixture.dependencies,
    ).syncOnce();
    assert.ok(result.error.includes(`failed (${status})`));
    assert.equal(fixture.messages.at(-1).phase, "error");
    assert.equal(fixture.figma.writes, 0);
    assert.equal(fixture.data.size, 0);
  }
});
