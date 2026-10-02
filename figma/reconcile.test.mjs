import assert from "node:assert/strict";
import { test } from "vitest";
import {
  batchKeys,
  compileBatch,
  createLedger,
  mergeLedgerPatch,
  planDeprecations,
} from "./compiler.mjs";
import { fakeFigma } from "./fixtures/fake-figma.mjs";
import { pilotScene } from "./fixtures/pilot.mjs";
import { validateScene } from "./schema.mjs";
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
async function run(
  scene,
  figma,
  ledger = createLedger({ fileKey: figma.fileKey, package: scene.package }),
) {
  const results = [];
  for (const key of batchKeys(scene)) {
    const compiled = compileBatch(scene, ledger, { fileKey: figma.fileKey, batchKey: key });
    const result = await new AsyncFunction("figma", compiled.code)(figma);
    assert.ok(JSON.stringify(result).length < 20000, "response remains under tool limit");
    ledger = mergeLedgerPatch(ledger, result.ledgerPatch);
    results.push(result);
    if (!result.ok) return { ledger, results, error: result.error };
  }
  return { ledger, results };
}

test("native IDs, variables and properties persist; identical release performs no writes", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  const first = await run(scene, figma);
  assert.equal(first.error, undefined);
  assert.equal(figma.snapshot().variables.length, 4);
  const ids = Object.fromEntries(Object.entries(first.ledger.entities).map(([k, v]) => [k, v.id]));
  const writes = figma.writes;
  const second = await run(scene, figma, first.ledger);
  assert.equal(second.error, undefined);
  assert.equal(figma.writes, writes);
  assert.deepEqual(
    Object.fromEntries(Object.entries(second.ledger.entities).map(([k, v]) => [k, v.id])),
    ids,
  );
  assert.ok(
    second.results.every((r) => r.createdNodeIds.length === 0 && r.mutatedNodeIds.length === 0),
  );
  const text = figma.snapshot().nodes.get(ids["pilot/button/Primary/label"]);
  assert.equal(text.componentPropertyReferences.characters, ids["pilot/property/label"]);
  assert.equal(text.fills[0].boundVariables.color.id, ids["pilot/color/white"]);
});

test("incremental text updates preserve component and layer IDs plus unmanaged designer layers", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  const first = await run(scene, figma);
  const componentId = first.ledger.entities["pilot/button/Primary"].id;
  const userNode = figma.createRectangle();
  userNode.name = "Designer annotation";
  figma.snapshot().nodes.get(componentId).appendChild(userNode);
  scene.release.version = "0.2.0";
  scene.pages[0].children[0].children[0].children[0].text.characters = "Join us";
  const next = await run(scene, figma, first.ledger);
  assert.equal(next.error, undefined);
  assert.equal(next.ledger.entities["pilot/button/Primary"].id, componentId);
  assert.equal(figma.snapshot().nodes.get(componentId).children.includes(userNode), true);
  assert.equal(
    figma.snapshot().nodes.get(next.ledger.entities["pilot/button/Primary/label"].id).characters,
    "Join us",
  );
});

test("removed assets are reported without destroying user content or previous identities", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  const first = await run(scene, figma);
  scene.pages[0].children = [];
  const next = await run(scene, figma, first.ledger);
  assert.equal(next.error, undefined);
  const deprecated = planDeprecations(scene, next.ledger);
  assert.ok(deprecated.some((n) => n.key === "pilot/button"));
  assert.ok(figma.snapshot().nodes.has(first.ledger.entities["pilot/button"].id));
});

test("type migrations and missing managed nodes fail closed instead of recreating", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  const first = await run(scene, figma);
  const label = scene.pages[0].children[0].children[0].children[0];
  label.type = "RECTANGLE";
  delete label.text;
  delete label.textStyle;
  delete label.propertyReferences;
  const changed = await run(scene, figma, first.ledger);
  assert.match(changed.error.message, /Type change/);
  const original = pilotScene();
  figma.snapshot().nodes.delete(first.ledger.entities["pilot/button/Primary/label"].id);
  const missing = await run(original, figma, first.ledger);
  assert.match(missing.error.message, /missing/);
});

test("a returned partial failure can be read and retried without duplicate creation", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  figma.failAfter(4);
  const partial = await run(scene, figma);
  assert.match(partial.error.message, /Injected/);
  const count = figma.snapshot().collections.length;
  const retry = await run(scene, figma, partial.ledger);
  assert.equal(retry.error, undefined);
  assert.equal(figma.snapshot().collections.length, count);
});

test("unsupported mandatory fidelity and missing fonts block before mutation", async () => {
  const scene = pilotScene();
  scene.diagnostics.push({
    severity: "error",
    code: "filter",
    message: "Unsupported backdrop filter",
  });
  assert.throws(() => validateScene(scene), /mandatory fidelity/);
  const clean = pilotScene(),
    figma = fakeFigma();
  figma.listAvailableFontsAsync = async () => [];
  const result = await run(clean, figma);
  assert.match(result.error.message, /Required font unavailable/);
  assert.equal(figma.writes, 0);
});

test("aliased variables are allocated before forward references and cycles are rejected", async () => {
  const scene = pilotScene();
  scene.variables.unshift({
    ...scene.variables[0],
    key: "pilot/alias",
    name: "color/alias",
    values: { Value: { alias: "pilot/color/white" } },
  });
  const figma = fakeFigma();
  const result = await run(scene, figma);
  assert.equal(result.error, undefined);
  assert.deepEqual(figma.snapshot().variables[0].valuesByMode, {
    [result.ledger.entities["pilot/collection"].modeIds.Value]: {
      type: "VARIABLE_ALIAS",
      id: result.ledger.entities["pilot/color/white"].id,
    },
  });
  scene.variables[1].values = { Value: { alias: "pilot/alias" } };
  assert.throws(() => validateScene(scene), /cyclic/);
});

test("large scenes use bounded sequential page and foundation chunks with stable replay", async () => {
  const scene = pilotScene();
  for (let i = 0; i < 35; i++) {
    scene.variables.push({ ...scene.variables[3], key: `space/${i}`, name: `spacing/${i}` });
    scene.pages[0].children.push({
      key: `rect/${i}`,
      name: `Rectangle ${i}`,
      type: "RECTANGLE",
      width: 100,
      height: 50,
      fills: [],
    });
  }
  assert.ok(batchKeys(scene).length > 10);
  const figma = fakeFigma();
  const first = await run(scene, figma);
  assert.equal(first.error, undefined);
  const writes = figma.writes;
  const again = await run(scene, figma, first.ledger);
  assert.equal(again.error, undefined);
  assert.equal(figma.writes, writes);
});

test("ledger patches cannot redirect existing stable identity or another file", () => {
  const ledger = createLedger({ fileKey: "file", package: "pkg" });
  ledger.entities.key = { id: "1:1", kind: "node" };
  assert.throws(
    () =>
      mergeLedgerPatch(ledger, {
        entities: { key: { id: "2:2", kind: "node" } },
        completedBatches: {},
      }),
    /stable identity/,
  );
  assert.throws(
    () => compileBatch(pilotScene(), ledger, { fileKey: "different", batchKey: "foundations" }),
    /identity mismatch/,
  );
});

test("unchanged managed text, paint bindings and variable values are audited before success", async () => {
  for (const mutation of ["text", "paint", "variable"]) {
    const scene = pilotScene(),
      figma = fakeFigma();
    const first = await run(scene, figma);
    const text = figma.snapshot().nodes.get(first.ledger.entities["pilot/button/Primary/label"].id);
    if (mutation === "text") text.characters = "Designer changed generated text";
    if (mutation === "paint") text.fills = [];
    if (mutation === "variable") {
      const variable = figma
        .snapshot()
        .variables.find((v) => v.id === first.ledger.entities["pilot/color/white"].id);
      variable.setValueForMode(first.ledger.entities["pilot/collection"].modeIds.Value, {
        r: 1,
        g: 0,
        b: 0,
        a: 1,
      });
    }
    scene.release.version = "0.2.0";
    const retry = await run(scene, figma, first.ledger);
    assert.match(retry.error.message, /native content drifted/);
    assert.notEqual(retry.ledger.appliedRelease?.version, "0.2.0");
  }
});

test("a legacy ledger refreshes code-owned values before establishing its native baseline", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  const first = await run(scene, figma);
  for (const record of Object.values(first.ledger.entities)) delete record.nativeFingerprint;
  figma.snapshot().nodes.get(first.ledger.entities["pilot/button/Primary/label"].id).characters =
    "Legacy drift";
  const migrated = await run(scene, figma, first.ledger);
  assert.equal(migrated.error, undefined);
  assert.equal(
    figma.snapshot().nodes.get(first.ledger.entities["pilot/button/Primary/label"].id).characters,
    "Get involved",
  );
  const replay = await run(scene, figma, migrated.ledger);
  assert.equal(replay.error, undefined);
  assert.ok(replay.results.every((r) => r.mutatedNodeIds.length === 0));
});

test("absolute geometry drift and wrong native parents fail even with a legacy parent mapping", async () => {
  const scene = pilotScene();
  const label = scene.pages[0].children[0].children[0].children[0];
  label.layoutPositioning = "ABSOLUTE";
  label.x = 5;
  label.y = 7;
  const figma = fakeFigma(),
    first = await run(scene, figma),
    text = figma.snapshot().nodes.get(first.ledger.entities[label.key].id);
  text.x = 99;
  assert.match((await run(scene, figma, first.ledger)).error.message, /native content drifted/);
  text.x = 5;
  figma.currentPage.appendChild(text);
  delete first.ledger.entities[label.key].parentKey;
  assert.match((await run(scene, figma, first.ledger)).error.message, /expected parent/);
});

test("legacy property defaults are refreshed before a baseline is accepted", async () => {
  const scene = pilotScene(),
    figma = fakeFigma(),
    first = await run(scene, figma);
  const set = figma.snapshot().nodes.get(first.ledger.entities["pilot/button"].id);
  set.definitions[first.ledger.entities["pilot/property/label"].id].defaultValue = "WRONG";
  for (const record of Object.values(first.ledger.entities)) delete record.nativeFingerprint;
  const repaired = await run(scene, figma, first.ledger);
  assert.equal(repaired.error, undefined);
  assert.equal(
    set.definitions[first.ledger.entities["pilot/property/label"].id].defaultValue,
    "Get involved",
  );
});

test("captured paint opacity survives a binding helper that replaces alpha", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  scene.pages[0].children[0].children[0].fills[0].opacity = 0.070588;
  const helper = figma.variables.setBoundVariableForPaint;
  figma.variables.setBoundVariableForPaint = (...args) => ({ ...helper(...args), opacity: 1 });
  const result = await run(scene, figma);
  assert.equal(result.error, undefined);
  const node = figma.snapshot().nodes.get(result.ledger.entities["pilot/button/Primary"].id);
  assert.equal(node.fills[0].opacity, 0.070588);
  assert.ok(node.fills[0].boundVariables.color);
});

test("native alpha normalization fails visibly until the token contains the CSS modifier", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  scene.pages[0].children[0].children[0].fills[0].opacity = 0.07;
  const create = figma.createComponent;
  figma.createComponent = () => {
    const node = create();
    let paints = node.fills;
    Object.defineProperty(node, "fills", {
      get: () => paints,
      set: (value) => {
        paints = value.map((paint) =>
          paint.boundVariables?.color ? { ...paint, opacity: 1 } : paint,
        );
      },
    });
    return node;
  };
  const result = await run(scene, figma);
  assert.match(result.error.message, /BOUND_ALPHA_MISMATCH/);
});

test("an explicit source wrapper reparents a known text layer without changing its identity", async () => {
  const scene = pilotScene(),
    figma = fakeFigma(),
    first = await run(scene, figma);
  const component = scene.pages[0].children[0].children[0],
    label = component.children[0];
  const id = first.ledger.entities[label.key].id;
  component.children = [
    {
      key: "pilot/content-clip",
      name: "Content clip",
      type: "FRAME",
      width: 108,
      height: 24,
      layout: { mode: "HORIZONTAL" },
      clipsContent: true,
      children: [label],
    },
  ];
  const updated = await run(scene, figma, first.ledger);
  assert.equal(updated.error, undefined);
  assert.equal(updated.ledger.entities[label.key].id, id);
  assert.equal(
    figma.snapshot().nodes.get(id).parent.id,
    updated.ledger.entities["pilot/content-clip"].id,
  );
  const replay = await run(scene, figma, updated.ledger);
  assert.equal(replay.error, undefined);
  assert.ok(
    replay.results.every(
      (result) => result.createdNodeIds.length === 0 && result.mutatedNodeIds.length === 0,
    ),
  );
});

test("derived Auto Layout and wrapping text dimensions may settle after a batch without false drift", async () => {
  const scene = pilotScene(),
    figma = fakeFigma();
  const child = {
    key: "pilot/fill-child",
    name: "Fill child",
    type: "RECTANGLE",
    width: 10,
    height: 10,
    layoutSizingVertical: "FILL",
  };
  scene.pages[0].children[0].children[0].children.push(child);
  const first = await run(scene, figma);
  assert.equal(first.error, undefined);
  figma.snapshot().nodes.get(first.ledger.entities[child.key].id).height = 44;
  figma.snapshot().nodes.get(first.ledger.entities["pilot/button/Primary/label"].id).height = 48;
  const replay = await run(scene, figma, first.ledger);
  assert.equal(replay.error, undefined);
  assert.ok(
    replay.results.every(
      (result) => result.createdNodeIds.length === 0 && result.mutatedNodeIds.length === 0,
    ),
  );
});
