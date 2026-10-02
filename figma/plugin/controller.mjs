import {
  batchKeys,
  compileBatch,
  createLedger,
  mergeLedgerPatch,
  planDeprecations,
  prepareScene,
  validateLedger,
} from "../compiler.mjs";
import { sha256 } from "../hash.mjs";
import { reconcileBatch } from "../runtime.mjs";
import { validateScene } from "../schema.mjs";
import { documentStore } from "./storage.mjs";

const badKeys = new Set(["__proto__", "prototype", "constructor"]);
function plainJson(value) {
  if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value)) {
      if (badKeys.has(key)) throw new Error(`Reserved JSON key ${key}`);
      plainJson(child);
    }
  return value;
}
function newerVersion(next, previous) {
  const parse = (v) => {
    if (!/^\d+\.\d+\.\d+$/.test(v))
      throw new Error(`Automatic syncing requires a stable semantic version, received ${v}`);
    return v.split(".").map(Number);
  };
  const a = parse(next),
    b = parse(previous);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}
/** No downloaded code is executed. Only validated JSON from the configured release repository is applied. */
export function createPluginController(figma, config, dependencies = {}) {
  const request = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  const sleep = dependencies.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const report =
    dependencies.report ?? ((status) => figma.ui.postMessage({ type: "status", ...status }));
  const store = documentStore(figma.root);
  const owner = `${now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let running = false;
  let cached = null;
  const deadline = async (operation, milliseconds = 30000) => {
    let timer;
    try {
      return await Promise.race([
        operation,
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(new Error("Release request timed out; the next scheduled check will retry")),
            milliseconds,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository) || !/^[A-Za-z0-9]+$/.test(config.fileKey))
    throw new Error("Invalid configured repository or target file");
  const identity = () => {
    if (figma.editorType !== "figma" || !figma.fileKey || figma.fileKey !== config.fileKey)
      throw new Error(
        "Open the configured Figma Design file with the registered private/development plugin. This plugin will not write a different or unverified file.",
      );
  };
  const state = () => {
    const saved = store.load();
    if (saved) {
      validateLedger(saved.ledger, { fileKey: config.fileKey, package: config.package });
      return saved;
    }
    const ledger =
      config.seedLedger ?? createLedger({ fileKey: config.fileKey, package: config.package });
    validateLedger(ledger, { fileKey: config.fileKey, package: config.package });
    return { schemaVersion: 1, ledger, release: null };
  };
  const checkLease = () => {
    const lease = store.read("lease");
    if (lease?.owner !== owner || lease.expiresAt < now())
      throw new Error(
        "Another sync session owns this document. Stop this session and keep a single release listener open.",
      );
  };
  const acquire = async () => {
    const current = store.read("lease");
    if (current && current.owner !== owner && current.expiresAt > now())
      throw new Error(
        "Another collaborator is already syncing this document. This session will stay read-only.",
      );
    store.write("lease", { owner, expiresAt: now() + 120000 });
    await sleep(300);
    checkLease();
  };
  const renew = () => {
    checkLease();
    store.write("lease", { owner, expiresAt: now() + 120000 });
  };
  const jsonRequest = async (url) => {
    const response = await deadline(
      request(url, { headers: { Accept: "application/vnd.github+json" } }),
    );
    if (!response.ok) throw new Error(`Release request failed (${response.status}): ${url}`);
    return plainJson(await deadline(response.json()));
  };
  const assetText = async (asset, limit) => {
    const expected = `https://github.com/${config.repository}/releases/download/`;
    if (
      !asset?.browser_download_url?.startsWith(expected) ||
      typeof asset.size !== "number" ||
      asset.size > limit
    )
      throw new Error("Release asset origin or size does not match the configured repository");
    const response = await deadline(request(asset.browser_download_url));
    if (!response.ok) throw new Error(`Release asset request failed (${response.status})`);
    const text = await deadline(response.text());
    let bytes = 0;
    for (const char of text) {
      const point = char.codePointAt(0);
      bytes += point < 128 ? 1 : point < 2048 ? 2 : point < 65536 ? 3 : 4;
      if (bytes > limit) throw new Error("Release asset exceeds size limit");
    }
    return text;
  };
  const getRelease = async () => {
    const metadata = await jsonRequest(
      `https://api.github.com/repos/${config.repository}/releases/latest`,
    );
    if (
      metadata.draft ||
      metadata.prerelease ||
      !Number.isSafeInteger(metadata.id) ||
      !Number.isFinite(Date.parse(metadata.published_at))
    )
      throw new Error("Latest release is not a valid published stable release");
    return metadata;
  };
  async function syncOnce() {
    if (running) return { skipped: "running" };
    running = true;
    let acquired = false;
    try {
      identity();
      const saved = state();
      if (store.read("pending"))
        throw new Error(
          "A previous sync ended without a committed result. Export the recovery state and inspect the canvas before importing a reconciled ledger; automatic retries are paused.",
        );
      report({ phase: "checking", message: "Checking the latest package release…" });
      const metadata = await getRelease();

      if (
        saved.release &&
        saved.release.id !== metadata.id &&
        Date.parse(metadata.published_at) <= Date.parse(saved.release.publishedAt)
      )
        throw new Error("Refusing an older or out-of-order release");
      const sceneAsset = metadata.assets?.find((a) => a.name === "figma-scene.json");
      const hashAsset = metadata.assets?.find((a) => a.name === "figma-scene.json.sha256");
      if (!sceneAsset || !hashAsset)
        throw new Error(
          "The latest release has no complete Figma scene and checksum yet. Waiting for release generation to finish.",
        );
      const raw =
          cached?.releaseId === metadata.id
            ? cached.raw
            : await assetText(sceneAsset, 30 * 1024 * 1024),
        checksum =
          cached?.releaseId === metadata.id
            ? cached.checksum
            : (await assetText(hashAsset, 512)).trim().split(/\s+/)[0];
      if (!/^[a-f0-9]{64}$/.test(checksum) || sha256(raw) !== checksum)
        throw new Error("Figma scene checksum mismatch");
      const scene = plainJson(JSON.parse(raw));
      validateScene(scene);
      if (
        scene.package !== config.package ||
        scene.source?.completeInventory !== true ||
        scene.source?.repository !== config.repository ||
        scene.source?.dirtyCheckout !== false ||
        !/^[a-f0-9]{40}$/.test(scene.release.commit)
      )
        throw new Error(
          "Release scene must have the configured package, a full source commit and completeInventory=true",
        );
      if (
        ![
          scene.release.version,
          `v${scene.release.version}`,
          `${scene.package}@${scene.release.version}`,
        ].includes(metadata.tag_name)
      )
        throw new Error("Scene version does not match its GitHub release tag");
      const exactResume =
        saved.ledger.appliedRelease?.version === scene.release.version &&
        saved.ledger.appliedRelease?.commit === scene.release.commit;
      if (
        saved.ledger.appliedRelease &&
        !exactResume &&
        !newerVersion(scene.release.version, saved.ledger.appliedRelease.version)
      )
        throw new Error("Refusing a release that does not advance the package version");
      if (saved.release?.id === metadata.id && saved.release.sceneSha256 !== checksum)
        throw new Error(
          "Previously applied release content has changed; refusing mutable release assets",
        );
      const commit = await jsonRequest(
        `https://api.github.com/repos/${config.repository}/commits/${encodeURIComponent(metadata.tag_name)}`,
      );
      if (commit.sha !== scene.release.commit)
        throw new Error("Scene source commit does not match the immutable release tag");
      cached = { releaseId: metadata.id, raw, checksum };
      await acquire();
      acquired = true;
      // Re-read shared state after lease acquisition; another user may have finished while this session fetched.
      const fresh = state();
      if (
        fresh.release?.id !== saved.release?.id ||
        JSON.stringify(fresh.ledger) !== JSON.stringify(saved.ledger)
      )
        throw new Error(
          "Document state changed while fetching the release; the next check will use the new state",
        );
      const prepared = prepareScene(scene);
      let ledger = fresh.ledger;
      const keys = batchKeys(scene);
      let changedNodes = 0;
      for (const [index, key] of keys.entries()) {
        renew();
        const latest = state();
        if (JSON.stringify(latest.ledger) !== JSON.stringify(ledger))
          throw new Error(
            "Concurrent document checkpoint change detected; stopping before the next mutation",
          );
        const compiled = compileBatch(scene, ledger, {
          fileKey: config.fileKey,
          batchKey: key,
          transport: "native",
          prepared,
        });
        store.write("pending", {
          owner,
          releaseId: metadata.id,
          sceneSha256: checksum,
          batchKey: key,
          startedAt: now(),
        });
        report({
          phase: "syncing",
          message: `Updating ${index + 1} of ${keys.length}…`,
          version: scene.release.version,
        });
        const result = await reconcileBatch(figma, compiled.payload, sha256);
        // Persist every returned identity, including partial results, before inspecting success.
        const nextLedger = mergeLedgerPatch(ledger, result.ledgerPatch);
        if (JSON.stringify(nextLedger) !== JSON.stringify(ledger))
          store.save({ ...fresh, ledger: nextLedger });
        ledger = nextLedger;
        if (!result.ok)
          throw new Error(
            `Sync stopped: ${result.error.message}. The partial ledger is saved; inspect the canvas before recovery.`,
          );
        store.write("pending", null);
        changedNodes += result.createdNodeIds.length + result.mutatedNodeIds.length;
      }
      renew();
      const deprecated = planDeprecations(scene, ledger);
      store.save({
        schemaVersion: 1,
        ledger,
        release: {
          id: metadata.id,
          tag: metadata.tag_name,
          publishedAt: metadata.published_at,
          sceneSha256: checksum,
        },
        deprecated,
      });
      report({
        phase: "listening",
        version: scene.release.version,
        message: `Synced ${scene.release.version}. ${changedNodes} node changes; ${deprecated.length} deprecated assets retained. Listening while open.`,
      });
      return { ok: true, changedNodes, deprecated };
    } catch (error) {
      report({ phase: "error", message: String(error.message ?? error) });
      return { ok: false, error: String(error.message ?? error) };
    } finally {
      if (acquired && store.read("lease")?.owner === owner) store.write("lease", null);
      running = false;
    }
  }
  return {
    syncOnce,
    exportState() {
      identity();
      return { ...state(), pending: store.read("pending") };
    },
    async importState(imported) {
      if (running) throw new Error("Wait until the current sync finishes before importing state");
      running = true;
      try {
        identity();
        plainJson(imported);
        validateLedger(imported.ledger, { fileKey: config.fileKey, package: config.package });
        for (const record of Object.values(imported.ledger.entities))
          if (["page", "node"].includes(record.kind)) {
            const node = await figma.getNodeByIdAsync(record.id);
            if (!node || node.type !== (record.type === "SVG" ? "FRAME" : record.type))
              throw new Error(
                `Recovery ledger node is missing or has the wrong type: ${record.id}`,
              );
          }
        await acquire();
        try {
          store.save({ schemaVersion: 1, ledger: imported.ledger, release: null });
          store.write("pending", null);
        } finally {
          if (store.read("lease")?.owner === owner) store.write("lease", null);
        }
        report({
          phase: "ready",
          message: "Recovery ledger imported. Check for updates to resume.",
        });
      } finally {
        running = false;
      }
    },
  };
}

/** Starts native UI polling; no Codex, model, token or browser automation is involved. */
export function startNativePlugin(figma, config, html) {
  figma.showUI(html, { width: 440, height: 430, themeColors: true });
  const controller = createPluginController(figma, config);
  figma.ui.onmessage = async (message) => {
    try {
      if (message.type === "check") await controller.syncOnce();
      if (message.type === "export")
        figma.ui.postMessage({ type: "export", state: controller.exportState() });
      if (message.type === "import") await controller.importState(message.state);
    } catch (error) {
      figma.ui.postMessage({
        type: "status",
        phase: "error",
        message: String(error.message ?? error),
      });
    }
  };
  void controller.syncOnce();
  const timer = setInterval(() => {
    void controller.syncOnce();
  }, config.pollIntervalMs ?? 300000);
  figma.on("close", () => clearInterval(timer));
}
