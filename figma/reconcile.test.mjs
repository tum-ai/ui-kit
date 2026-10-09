import assert from "node:assert/strict";
import { test } from "vitest";
import {
  batchKeys,
  compileBatch,
  contentHash,
  createLedger,
  mergeLedgerPatch,
  planDeprecations,
} from "./compiler.mjs";
import { fakeFigma } from "./fixtures/fake-figma.mjs";
import { pilotScene } from "./fixtures/pilot.mjs";
import { validateScene } from "./schema.mjs";
import { reconcileBatch } from "./runtime.mjs";
import { sha256 } from "./hash.mjs";
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
async function run(
  scene,
  figma,
  ledger = createLedger({ fileKey: figma.fileKey, package: scene.package }),
  native = false,
) {
  const results = [];
  for (const key of batchKeys(scene)) {
    const compiled = compileBatch(scene, ledger, {
      fileKey: figma.fileKey,
      batchKey: key,
      transport: native ? "native" : "mcp",
    });
    const result = native
      ? await reconcileBatch(figma, compiled.payload, sha256)
      : await new AsyncFunction("figma", compiled.code)(figma);
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

function typographyFixture(naturalWidth = 108.25) {
  const scene = pilotScene();
  const label = scene.pages[0].children[0].children[0].children[0];
  label.source = { css: { "white-space": "nowrap" } };
  const figma = fakeFigma();
  const createText = figma.createText;
  figma.createText = () => {
    const node = createText();
    let mode = "NONE";
    Object.defineProperty(node, "textAutoResize", {
      get: () => mode,
      set(value) {
        mode = value;
        if (value === "WIDTH_AND_HEIGHT") {
          this.width = naturalWidth;
          this.height = 24;
        }
      },
    });
    const resize = node.resize.bind(node);
    node.resize = (width, height) => {
      resize(width, height);
      mode = "NONE";
    };
    return node;
  };
  return { scene, label, figma };
}

test("CSS nowrap uses native intrinsic width after resize while ordinary text retains fixed width", async () => {
  const { scene, label, figma } = typographyFixture();
  const geometry = JSON.stringify({
    width: label.width,
    height: label.height,
    x: label.x,
    y: label.y,
  });
  const first = await run(scene, figma, undefined, true);
  assert.equal(first.error, undefined);
  const node = figma.snapshot().nodes.get(first.ledger.entities[label.key].id);
  assert.equal(node.textAutoResize, "WIDTH_AND_HEIGHT");
  assert.equal(node.width, 108.25);
  const normal = figma.snapshot().nodes.get(first.ledger.entities["pilot/button/Outline/label"].id);
  assert.equal(normal.textAutoResize, "HEIGHT");
  assert.equal(normal.width, 108);
  assert.equal(node.parent.width, 156);
  assert.equal(
    JSON.stringify({ width: label.width, height: label.height, x: label.x, y: label.y }),
    geometry,
  );
  const writes = figma.writes;
  const replay = await run(scene, figma, first.ledger, true);
  assert.equal(replay.error, undefined);
  assert.equal(figma.writes, writes);
  assert.equal(replay.ledger.entities[label.key].id, node.id);
  node.textAutoResize = "NONE";
  const drift = await run(scene, figma, replay.ledger, true);
  assert.match(drift.error.message, /native content drifted/);
});

test("nowrap reports real additional clipping without changing fonts or containing geometry", async () => {
  const { scene, label, figma } = typographyFixture(180);
  const component = scene.pages[0].children[0].children[0];
  component.clipsContent = true;
  const result = await run(scene, figma, undefined, true);
  assert.match(result.error.message, /TEXT_METRICS_OVERFLOW/);
  const node = figma.snapshot().nodes.get(result.ledger.entities[label.key].id);
  assert.equal(node.parent.width, 156);
  assert.equal(node.fontSize, 15);
  assert.equal(node.characters, label.text.characters);
});

test("text sizing policy migrates a verified legacy baseline and preserves native identity", async () => {
  const { scene, label, figma } = typographyFixture();
  delete label.textStyle;
  delete label.propertyReferences;
  label.fills = [];
  label.source.css["white-space"] = "normal";
  const first = await run(scene, figma, undefined, true);
  assert.equal(first.error, undefined);
  const record = first.ledger.entities[label.key];
  const node = figma.snapshot().nodes.get(record.id);
  node.textAutoResize = "NONE";
  delete record.textSizingMode;
  // Version-2 baseline written by the previous engine after resize reset autosizing.
  record.nativeFingerprint = contentHash({
    name: node.name,
    width: node.width,
    bindings: {},
    fills: [],
    strokes: [],
    effects: [],
    characters: node.characters,
    textStyleId: "",
    ...label.text,
    textAutoResize: "NONE",
  });
  label.source.css["white-space"] = "nowrap";
  node.resize = () => {
    throw Error("A sizing-only migration must preserve source geometry");
  };
  node.setTextStyleIdAsync = async () => {
    throw Error("A sizing-only migration must preserve styles");
  };
  const migrated = await run(scene, figma, first.ledger, true);
  assert.equal(migrated.error, undefined);
  assert.equal(migrated.ledger.entities[label.key].id, record.id);
  assert.equal(node.textAutoResize, "WIDTH_AND_HEIGHT");
  assert.equal(migrated.ledger.entities[label.key].textSizingMode, "WIDTH_AND_HEIGHT");
  const replay = await run(scene, figma, migrated.ledger, true);
  assert.equal(replay.error, undefined);
  assert.ok(replay.results.every((r) => r.mutatedNodeIds.length === 0));
});

test("a sizing-policy migration refuses to overwrite manual edits to the legacy baseline", async () => {
  const { scene, label, figma } = typographyFixture();
  label.source.css["white-space"] = "normal";
  const first = await run(scene, figma, undefined, true);
  const record = first.ledger.entities[label.key];
  delete record.textSizingMode;
  const node = figma.snapshot().nodes.get(record.id);
  node.characters = "Designer edit";
  label.source.css["white-space"] = "nowrap";
  const result = await run(scene, figma, first.ledger, true);
  assert.match(result.error.message, /native content drifted/);
  assert.equal(node.characters, "Designer edit");
  assert.equal(node.textAutoResize, "HEIGHT");
});

test("only captured single-line inline fragments gain intrinsic sizing; paragraphs and wrapped fragments do not", async () => {
  for (const [display, block, lineCount, expected] of [
    ["inline", false, 1, "WIDTH_AND_HEIGHT"],
    ["inline-block", false, 1, "WIDTH_AND_HEIGHT"],
    ["inline-flex", false, 1, "WIDTH_AND_HEIGHT"],
    ["inline-block", false, 2, "HEIGHT"],
    ["inline-block", true, 1, "HEIGHT"],
    ["block", false, 1, "HEIGHT"],
  ]) {
    const { scene, label, figma } = typographyFixture();
    label.source = {
      block,
      lineRects: Array.from({ length: lineCount }, () => ({ width: 108, height: 24 })),
      css: { display, "white-space": "normal" },
    };
    const result = await run(scene, figma, undefined, true);
    assert.equal(result.error, undefined);
    const node = figma.snapshot().nodes.get(result.ledger.entities[label.key].id);
    assert.equal(node.textAutoResize, expected, `${display}, block=${block}, lines=${lineCount}`);
    assert.equal(node.width, expected === "HEIGHT" ? 108 : 108.25);
  }
});

test("painted glyphs that fit remain valid even when the intrinsic text box rounds beyond its clip", async () => {
  const { scene, label, figma } = typographyFixture(154);
  const component = scene.pages[0].children[0].children[0];
  component.width = 152.859;
  component.height = 46.5;
  component.clipsContent = true;
  label.width = 153.359;
  label.height = 22.5;
  const createText = figma.createText;
  figma.createText = () => {
    const node = createText();
    Object.defineProperty(node, "absoluteBoundingBox", {
      get: () => ({ x: 512, y: 620, width: node.width, height: node.height }),
    });
    node.absoluteRenderBounds = { x: 513.04999, y: 620, width: 151.6969, height: 20 };
    return node;
  };
  const createComponent = figma.createComponent;
  figma.createComponent = () => {
    const node = createComponent();
    Object.defineProperty(node, "absoluteBoundingBox", {
      get: () => ({ x: 512, y: 608, width: node.width, height: node.height }),
    });
    return node;
  };
  const first = await run(scene, figma, undefined, true);
  assert.equal(first.error, undefined);
  const node = figma.snapshot().nodes.get(first.ledger.entities[label.key].id);
  assert.equal(node.width, 154);
  assert.equal(node.parent.width, 152.859);
  assert.equal(node.textAutoResize, "WIDTH_AND_HEIGHT");
  const replay = await run(scene, figma, first.ledger, true);
  assert.equal(replay.error, undefined);
  assert.ok(replay.results.every((result) => result.mutatedNodeIds.length === 0));
  node.absoluteRenderBounds.width = 155;
  assert.match(
    (await run(scene, figma, replay.ledger, true)).error.message,
    /TEXT_METRICS_OVERFLOW.*paint/,
  );
});

test("intrinsic geometry fallback allows one-pixel native rounding without widening the clip", async () => {
  const { scene, label, figma } = typographyFixture(154);
  const component = scene.pages[0].children[0].children[0];
  component.width = 152.859;
  component.clipsContent = true;
  label.width = 153.359;
  const result = await run(scene, figma, undefined, true);
  assert.equal(result.error, undefined);
  const node = figma.snapshot().nodes.get(result.ledger.entities[label.key].id);
  assert.equal(node.parent.width, 152.859);
  assert.equal(node.width, 154);
});
