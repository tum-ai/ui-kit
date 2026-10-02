import { sha256 } from "./hash.mjs";
import { reconcileBatch } from "./runtime.mjs";
import { validateScene } from "./schema.mjs";

/** Stable JSON excludes provenance; changing a URL or release number never recreates assets. */
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .filter((k) => k !== "source" && value[k] !== undefined)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
export const contentHash = (value) => sha256(JSON.stringify(canonical(value)));
export function createLedger({ fileKey, package: packageName }) {
  if (!fileKey || !packageName)
    throw new Error("fileKey and package are required for a Figma ledger");
  return { schemaVersion: 1, fileKey, package: packageName, entities: {}, completedBatches: {} };
}
export function validateLedger(ledger, { fileKey, package: packageName }) {
  if (
    ledger?.schemaVersion !== 1 ||
    ledger.fileKey !== fileKey ||
    ledger.package !== packageName ||
    !ledger.entities ||
    !ledger.completedBatches
  )
    throw new Error("Invalid Figma ledger or target identity mismatch");
  const ids = new Set();
  for (const [key, record] of Object.entries(ledger.entities)) {
    if (
      ["__proto__", "prototype", "constructor"].includes(key) ||
      typeof record.id !== "string" ||
      !record.id ||
      typeof record.kind !== "string"
    )
      throw new Error(`Invalid ledger record ${key}`);
    const identity = `${record.kind}:${record.id}`;
    if (ids.has(identity)) throw new Error(`Figma ledger aliases more than one key to ${identity}`);
    ids.add(identity);
  }
  return ledger;
}
/** Apply a receipt-validated result, including partial records returned by a failed batch. */
export function mergeLedgerPatch(ledger, patch) {
  if (!patch || !patch.entities || !patch.completedBatches)
    throw new Error("Invalid Figma ledger patch");
  for (const map of [patch.entities, patch.completedBatches])
    for (const key of Object.keys(map))
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw new Error(`Invalid reserved patch key ${key}`);
  const next = JSON.parse(JSON.stringify(ledger));
  for (const [key, record] of Object.entries(patch.entities)) {
    if (
      next.entities[key] &&
      (next.entities[key].id !== record.id || next.entities[key].kind !== record.kind)
    )
      throw new Error(`Figma patch attempts to replace stable identity ${key}`);
    next.entities[key] = record;
  }
  Object.assign(next.completedBatches, patch.completedBatches);
  if (patch.appliedRelease) next.appliedRelease = patch.appliedRelease;
  return validateLedger(next, { fileKey: ledger.fileKey, package: ledger.package });
}
const entityHash = (spec) =>
  contentHash(
    spec.children ? { ...spec, children: spec.children.map((child) => child.key) } : spec,
  );
const chunks = (values, size = 10) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, i) =>
    values.slice(i * size, (i + 1) * size),
  );
const foundations = (scene) => ({
  kind: "foundations",
  key: "foundations",
  collections: scene.collections ?? [],
  variables: scene.variables ?? [],
  textStyles: scene.textStyles ?? [],
  effectStyles: scene.effectStyles ?? [],
});
function plan(scene) {
  const base = foundations(scene);
  const result = [];
  if (
    base.collections.length +
      base.variables.length +
      base.textStyles.length +
      base.effectStyles.length <=
    10
  )
    result.push(base);
  else {
    const empty = {
      kind: "foundations",
      collections: [],
      variables: [],
      textStyles: [],
      effectStyles: [],
    };
    for (const [field, kind, items] of [
      ["collections", "collections", base.collections],
      ["variables", "declare", base.variables],
      ["variables", "values", base.variables],
      ["textStyles", "text", base.textStyles],
      ["effectStyles", "effects", base.effectStyles],
    ]) {
      for (const [i, part] of chunks(items).entries())
        result.push({
          ...empty,
          key: `foundations/${kind}/${i + 1}`,
          [field]: part,
          ...(kind === "declare" ? { allocateOnly: true } : {}),
        });
    }
  }
  result.at(-1).foundationComplete = true;
  for (const page of scene.pages) {
    const nodes = [];
    const walk = (spec, parentKey) => {
      const shallow = {
        ...spec,
        children:
          spec.type === "COMPONENT_SET"
            ? spec.children.map((c) => ({
                key: c.key,
                name: c.name,
                type: c.type,
                width: c.width,
                height: c.height,
              }))
            : [],
      };
      nodes.push({ spec: shallow, parentKey });
      for (const child of spec.children ?? []) walk(child, spec.key);
    };
    page.children.forEach((n) => walk(n, page.key));
    const pieces = chunks(nodes);
    if (!pieces.length) pieces.push([]);
    for (const [i, part] of pieces.entries())
      result.push({
        kind: "page",
        key: pieces.length === 1 ? page.key : `${page.key}/${i + 1}`,
        page: { key: page.key, name: page.name, children: [] },
        nodes: part,
      });
  }
  return result;
}
/** Bounded topological batches, always executed sequentially with fresh external state. */
export function batchKeys(scene) {
  validateScene(scene);
  return plan(scene).map((batch) => batch.key);
}
export function sceneEntities(scene) {
  const entities = new Map();
  const add = (spec) => {
    entities.set(spec.key, spec);
  };
  for (const items of [scene.collections, scene.variables, scene.textStyles, scene.effectStyles])
    for (const spec of items ?? []) add(spec);
  const visit = (node) => {
    add(node);
    for (const p of node.componentProperties ?? []) add(p);
    for (const child of node.children ?? []) visit(child);
  };
  for (const page of scene.pages) {
    add(page);
    page.children.forEach(visit);
  }
  return entities;
}
export function planDeprecations(scene, ledger) {
  const active = sceneEntities(scene);
  return Object.entries(ledger.entities)
    .filter(([key]) => !active.has(key))
    .map(([key, record]) => ({ key, id: record.id, type: record.type }));
}
/** Prepare immutable scene data once for a native session with hundreds of batches. */
export function prepareScene(scene) {
  validateScene(scene);
  const batches = plan(scene),
    all = sceneEntities(scene);
  return {
    scene,
    batches,
    all,
    entityHashes: new Map([...all].map(([key, spec]) => [key, entityHash(spec)])),
    batchHashes: new Map(batches.map((batch) => [batch.key, contentHash(batch)])),
    foundationHash: contentHash(batches[0].key === "foundations" ? batches[0] : foundations(scene)),
  };
}
export function compileBatch(
  scene,
  ledger,
  { fileKey, batchKey, receipt, transport = "mcp", prepared } = {},
) {
  if (prepared && prepared.scene !== scene) throw new Error("Prepared scene identity mismatch");
  const context = prepared ?? prepareScene(scene);
  validateLedger(ledger, { fileKey, package: scene.package });
  const batches = context.batches,
    index = batches.findIndex((b) => b.key === batchKey);
  if (index < 0) throw new Error(`Unknown Figma batch ${batchKey}`);
  const batch = batches[index],
    foundationHash = contentHash(
      batches[0].key === "foundations" ? batches[0] : foundations(scene),
    );
  if (
    index > 0 &&
    ledger.completedBatches[batches[index - 1].key] !==
      context.batchHashes.get(batches[index - 1].key)
  )
    throw new Error(`Run and persist previous Figma batch ${batches[index - 1].key} first`);
  const all = context.all,
    relevant = new Set(),
    hashes = {},
    svgHashes = {},
    fonts = new Map();
  const addFont = (font) => {
    if (font) fonts.set(`${font.family}/${font.style}`, font);
  };
  const add = (key) => {
    if (relevant.has(key)) return;
    relevant.add(key);
    const spec = all.get(key);
    if (!spec) return;
    hashes[key] = context.entityHashes.get(key);
    if (spec.svg) svgHashes[key] = contentHash(spec.svg);
    if (spec.collection) add(spec.collection);
    for (const value of Object.values(spec.values ?? {})) if (value?.alias) add(value.alias);
    if (spec.fontName) addFont(spec.fontName);
    if (spec.text) {
      addFont(spec.text.fontName);
      for (const range of spec.text.ranges ?? []) {
        addFont(range.fontName);
        for (const paint of range.fills ?? []) if (paint.variable) add(paint.variable);
      }
    }
    for (const field of ["fills", "strokes"])
      for (const paint of spec[field] ?? []) if (paint.variable) add(paint.variable);
    for (const key of Object.values(spec.bindings ?? {})) add(key);
    for (const key of Object.keys(spec.variableModes ?? {})) add(key);
    for (const key of Object.values(spec.propertyReferences ?? {})) add(key);
    for (const property of spec.componentProperties ?? []) add(property.key);
    for (const field of ["textStyle", "effectStyle"]) if (spec[field]) add(spec[field]);
  };
  if (batch.kind === "foundations")
    for (const field of ["collections", "variables", "textStyles", "effectStyles"])
      batch[field].forEach((s) => add(s.key));
  else {
    add(batch.page.key);
    for (const entry of batch.nodes) {
      add(entry.spec.key);
      add(entry.parentKey);
      for (const child of entry.spec.children) add(child.key);
    }
  }
  // Retain the old ownership chain so explicit source reparenting can verify its starting point.
  for (const key of relevant) {
    let previous = ledger.entities[key];
    const seen = new Set();
    while (previous?.parentKey && !seen.has(previous.parentKey)) {
      seen.add(previous.parentKey);
      relevant.add(previous.parentKey);
      previous = ledger.entities[previous.parentKey];
    }
  }
  const subset = {
    ...ledger,
    entities: Object.fromEntries(
      [...relevant].filter((key) => ledger.entities[key]).map((key) => [key, ledger.entities[key]]),
    ),
    completedBatches: {},
  };
  const payload = {
    batch,
    ledger: subset,
    hashes,
    svgHashes,
    receipt: receipt ?? null,
    packageName: scene.package,
    fileKey,
    release: scene.release,
    fonts: [...fonts.values()],
    batchHash: context.batchHashes.get(batch.key),
    foundationHash,
    foundationComplete: !!batch.foundationComplete,
    finalBatch: index === batches.length - 1,
    flat: true,
  };
  // Bound returned state before any remote mutation. This intentionally overestimates IDs and metadata.
  const writers =
    batch.kind === "foundations"
      ? [...batch.collections, ...batch.variables, ...batch.textStyles, ...batch.effectStyles]
      : [
          batch.page,
          ...batch.nodes.map((n) => n.spec),
          ...batch.nodes.flatMap((n) => (n.spec.type === "COMPONENT_SET" ? n.spec.children : [])),
        ];
  const budget =
    2500 +
    writers.reduce(
      (sum, spec) =>
        sum +
        950 +
        spec.key.length * 3 +
        spec.name.length * 2 +
        Object.keys(spec).join().length +
        (spec.svg?.match(/<[a-zA-Z][\w:]*/g)?.length ?? 0) * 260,
      0,
    );
  if (transport !== "native" && budget > 18000)
    throw new Error(
      `Figma batch ${batchKey} estimated response ${budget} bytes exceeds safe 18000 byte budget; split the source component/variant set before writing`,
    );
  const code =
    transport === "native"
      ? ""
      : `${sha256.toString().replace(/^[ \t]+/gm, "")}\n${reconcileBatch.toString().replace(/^[ \t]+/gm, "")}\nreturn await reconcileBatch(figma, ${JSON.stringify(canonical(payload))}, sha256);`;
  if (transport !== "native" && code.length > 50000)
    throw new Error(
      `Figma MCP batch ${batchKey} exceeds the 50000-character script limit; use the native plugin or a smaller scene subset`,
    );
  return {
    key: batchKey,
    code,
    description: `Reconcile ${scene.package} ${batchKey} for ${scene.release.version}`,
    contentHash: payload.batchHash,
    payload,
    estimatedResponseBytes: budget,
  };
}
