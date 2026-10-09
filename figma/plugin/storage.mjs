import { sha256 } from "../hash.mjs";
/** Native plugin only: document-scoped checkpoints shared by collaborators using the same plugin ID. */
export function documentStore(root, prefix = "tumai.release-sync.v1") {
  // Cache hashes only for exact chunk bytes. Always read native storage again so
  // changes under an unchanged head cannot hide behind this performance cache.
  let verifiedChunks = new Map();
  const chunkHash = (part) => verifiedChunks.get(part) ?? sha256(part);
  const read = (name) => {
    const value = root.getPluginData(`${prefix}.${name}`);
    return value ? JSON.parse(value) : null;
  };
  const write = (name, value) =>
    root.setPluginData(`${prefix}.${name}`, value === null ? "" : JSON.stringify(value));
  return {
    read,
    write,
    load() {
      const head = read("head");
      if (!head) return null;
      if (
        !Array.isArray(head.chunks) ||
        head.chunks.length < 1 ||
        head.chunks.length > 1000 ||
        !head.chunks.every((hash) => /^[a-f0-9]{64}$/.test(hash))
      )
        throw new Error("Invalid document ledger header");
      let json = "";
      const nextCache = new Map();
      for (const hash of head.chunks) {
        const part = root.getPluginData(`${prefix}.blob.${hash}`);
        if (!part || chunkHash(part) !== hash)
          throw new Error(
            "Incomplete document ledger checkpoint; import the exported recovery ledger",
          );
        nextCache.set(part, hash);
        json += part;
      }
      const state = JSON.parse(json);
      verifiedChunks = nextCache;
      return state;
    },
    save(state) {
      const old = read("head"),
        json = JSON.stringify(state),
        chunks = [],
        nextCache = new Map();
      if (json.length > 16000000)
        throw new Error("Document ledger exceeds supported checkpoint size");
      // Content-addressed chunks keep unchanged prefixes from being rewritten every batch.
      // Each is far below Figma's 100 kB entry limit even after UTF-8 encoding.
      for (let i = 0; i < json.length; i += 16000) {
        const part = json.slice(i, i + 16000),
          hash = chunkHash(part);
        nextCache.set(part, hash);
        chunks.push(hash);
        const existing = root.getPluginData(`${prefix}.blob.${hash}`);
        if (existing && existing !== part)
          throw new Error("Document ledger chunk changed; refusing to overwrite recovery evidence");
        if (!existing) root.setPluginData(`${prefix}.blob.${hash}`, part);
      }
      // Commit only after every blob is complete; a failed blob write leaves the previous checkpoint readable.
      write("head", { chunks });
      verifiedChunks = nextCache;
      const retained = new Set(chunks);
      if (old)
        for (const hash of old.chunks)
          if (!retained.has(hash)) root.setPluginData(`${prefix}.blob.${hash}`, "");
    },
  };
}
