import { expect, test } from "vitest";

// @ts-expect-error Build tooling deliberately uses plain ESM.
import { buildCaptureInventory } from "../scripts/figma/inventory.mjs";
import {
  backgroundTiles,
  linearGradient,
  normalizeCapture,
  radialGradient,
  shadowEffects,
  splitCss,
  // @ts-expect-error Build tooling deliberately uses plain ESM.
} from "../scripts/figma/normalize.mjs";

const colors = {
  "rgb(255, 0, 0)": { r: 1, g: 0, b: 0, a: 1 },
  "rgb(0, 0, 255)": { r: 0, g: 0, b: 1, a: 1 },
  "rgba(0, 0, 0, 0.2)": { r: 0, g: 0, b: 0, a: 0.2 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

test("inventory deduplicates composed exports and keeps authored responsive stories", () => {
  const shared = { id: "content-card--primary", name: "Primary", widths: [] };
  const phone = { id: "content-card--phone", name: "Phone", widths: [390] };
  const manifest = {
    entries: [
      { identity: "kit#Card", runtime: true, stories: [shared, phone] },
      { identity: "kit#CardTitle", runtime: true, stories: [shared, phone] },
      { identity: "kit#CardProps", runtime: false, stories: [shared] },
      { identity: "kit#styleHelper", runtime: true, nonvisual: "style helper", stories: [shared] },
    ],
    pages: [{ id: "patterns-page--default", name: "Default", widths: [] }],
  };
  expect(buildCaptureInventory(manifest)).toMatchObject([
    { id: phone.id, width: 390, exports: ["kit#Card", "kit#CardTitle"], kind: "component" },
    { id: shared.id, width: 1440, exports: ["kit#Card", "kit#CardTitle"], kind: "component" },
    { id: "patterns-page--default", width: 1440, exports: [], kind: "example" },
  ]);
  expect(() => buildCaptureInventory(manifest, { storyIds: ["missing"] })).toThrow(
    "Unknown Figma story IDs",
  );
});

test("CSS tokenizer preserves nested functions, quoted text, and stop lists", () => {
  expect(
    splitCss('linear-gradient(rgb(1, 2, 3), color(srgb 0.1 0.2 0.3)), url("a,b.svg")'),
  ).toEqual(["linear-gradient(rgb(1, 2, 3), color(srgb 0.1 0.2 0.3))", 'url("a,b.svg")']);
  expect(splitCss("inset 0 1px 2px rgba(0, 0, 0, 0.2)", " ")).toEqual([
    "inset",
    "0",
    "1px",
    "2px",
    "rgba(0, 0, 0, 0.2)",
  ]);
});

test("gradient transforms preserve CSS start and end positions for non-square frames", () => {
  const gradient = linearGradient(
    "linear-gradient(to bottom, rgb(255, 0, 0), rgb(0, 0, 255))",
    { width: 300, height: 50 },
    colors,
  );
  const [a, b, c] = gradient.gradientTransform[0];
  expect(a * 0.5 + b * 0 + c).toBeCloseTo(0);
  expect(a * 0.5 + b * 1 + c).toBeCloseTo(1);
  expect(gradient.gradientStops).toEqual([
    { position: 0, color: colors["rgb(255, 0, 0)"] },
    { position: 1, color: colors["rgb(0, 0, 255)"] },
  ]);
  const reverse = linearGradient(
    "linear-gradient(to top, rgb(255, 0, 0) 0%, transparent 100%)",
    { width: 300, height: 50 },
    colors,
  );
  expect(reverse.gradientTransform[0][1]).toBeCloseTo(-1);
  expect(reverse.gradientTransform[0][2]).toBeCloseTo(1);
});

test("gradient converter interpolates omitted stops and rejects unrepresented effects", () => {
  const gradient = linearGradient(
    "linear-gradient(90deg, rgb(255, 0, 0) 0% 20%, rgb(0, 0, 255), transparent 100%)",
    { width: 100, height: 200 },
    colors,
  );
  gradient.gradientStops.forEach((stop: { position: number }, index: number) =>
    expect(stop.position).toBeCloseTo([0, 0.2, 0.6, 1][index]!),
  );
  expect(() =>
    linearGradient(
      "radial-gradient(rgb(255, 0, 0), transparent)",
      { width: 10, height: 10 },
      colors,
    ),
  ).toThrow("exact native conversion");
  expect(() =>
    linearGradient(
      "linear-gradient(90deg, rgb(255, 0, 0) -20%, transparent 100%)",
      { width: 10, height: 10 },
      colors,
    ),
  ).toThrow("paint-space extension");
});

test("multiple inset and outer shadows retain offsets, blur, spread and alpha", () => {
  expect(
    shadowEffects("inset 0 1px 0 rgba(0, 0, 0, 0.2), 2px 6px 12px -3px rgb(0, 0, 255)", colors),
  ).toMatchObject([
    { type: "INNER_SHADOW", offset: { x: 0, y: 1 }, radius: 0, spread: 0, color: { a: 0.2 } },
    { type: "DROP_SHADOW", offset: { x: 2, y: 6 }, radius: 12, spread: -3 },
  ]);
});

test("radial gradients preserve off-center elliptical CSS geometry", () => {
  const gradient = radialGradient(
    "radial-gradient(95% 75% at 12% 8%, rgb(255, 0, 0), transparent 62%)",
    { width: 200, height: 100 },
    colors,
  );
  const [[a, , tx], [, b, ty]] = gradient.gradientTransform;
  expect(a * 0.12 + tx).toBeCloseTo(0.5);
  expect(b * 0.08 + ty).toBeCloseTo(0.5);
  expect(a * (0.12 + 0.95) + tx).toBeCloseTo(1);
  expect(b * (0.08 + 0.75) + ty).toBeCloseTo(1);
  expect(gradient.gradientStops[1]).toEqual({ position: 0.62, color: { r: 1, g: 0, b: 0, a: 0 } });
});

test("native text remains a paragraph and does not apply parent opacity twice", () => {
  const style = {
    display: "block",
    opacity: "0.5",
    "background-color": "transparent",
    "background-image": "none",
    color: "rgb(255, 0, 0)",
    "font-family": "Manrope, sans-serif",
    "font-size": "16px",
    "font-weight": "400",
    "font-style": "normal",
    "line-height": "24px",
    "letter-spacing": "0px",
    "text-align": "start",
    "text-decoration-line": "none",
  };
  const text = {
    key: "paragraph/text",
    tag: "#text",
    text: "An editable paragraph that wraps.",
    bounds: { x: 20, y: 20, width: 120, height: 48 },
    style,
    source: { tone: "ink", firstLineHeight: 22, block: true },
    ranges: [],
  };
  const raw = {
    bounds: { x: 0, y: 0, width: 400, height: 300 },
    background: style,
    diagnostics: [],
    colors,
    hasPortal: false,
    fontFaces: [],
    children: [
      {
        key: "paragraph",
        name: "p",
        tag: "p",
        bounds: { x: 20, y: 20, width: 120, height: 48 },
        style,
        source: { tone: "ink" },
        children: [text],
      },
    ],
  };
  const { node } = normalizeCapture(
    raw,
    { id: "text--paragraph", name: "Paragraph", width: 390, family: "text", kind: "component" },
    { variableKeys: new Set(["css:--tone-canvas", "css:--text-display-xl"]) },
  );
  expect(node.opacity).toBe(0.5);
  expect(node.children).toHaveLength(1);
  expect(node.children[0]).toMatchObject({
    type: "TEXT",
    opacity: 1,
    text: { characters: text.text, textAutoResize: "HEIGHT" },
    variableModes: { "collection:tones": "ink", "collection:viewport": "390" },
  });
});

test("composite content-box masks become editable gradient border strokes", () => {
  const style = {
    display: "block",
    opacity: "1",
    "background-color": "transparent",
    "background-image": "linear-gradient(rgb(255, 0, 0), transparent)",
    "mask-image":
      "linear-gradient(rgb(255, 0, 0), rgb(255, 0, 0)), linear-gradient(rgb(255, 0, 0), rgb(255, 0, 0))",
    "mask-composite": "exclude, exclude",
    "mask-clip": "content-box, border-box",
    "padding-top": "1px",
    "padding-right": "1px",
    "padding-bottom": "1px",
    "padding-left": "1px",
  };
  const raw = {
    bounds: { x: 0, y: 0, width: 400, height: 300 },
    background: style,
    diagnostics: [],
    colors,
    hasPortal: false,
    fontFaces: [],
    children: [
      {
        key: "ring",
        name: "Border",
        tag: "::after",
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        style,
        source: {},
        children: [],
      },
    ],
  };
  const { node, diagnostics } = normalizeCapture(raw, {
    id: "ring--default",
    name: "Default",
    width: 1440,
    family: "ring",
    kind: "component",
  });
  expect(node.fills).toEqual([]);
  expect(node.strokes[0].type).toBe("GRADIENT_LINEAR");
  expect(node.strokeWeight).toBe(1);
  expect(diagnostics).toEqual([]);
});

test("single-component exports crop the explorer canvas and preserve unsupported fidelity failures", () => {
  const style = {
    display: "block",
    opacity: "1",
    "background-image": "none",
    "background-color": "rgb(255, 0, 0)",
    "clip-path": "polygon(0 0, 100% 0, 50% 100%)",
  };
  const raw = {
    bounds: { x: 16, y: 16, width: 1408, height: 1000 },
    children: [
      {
        key: "button/root/button-0",
        tag: "button",
        name: "button",
        bounds: { x: 40, y: 40, width: 120, height: 44 },
        style,
        source: {},
        children: [],
      },
    ],
    colors,
    background: style,
    diagnostics: [],
    hasPortal: false,
    fontFaces: [],
  };
  const capture = normalizeCapture(raw, {
    id: "actions-button--primary",
    name: "Primary",
    family: "actions-button",
    kind: "component",
    width: 1440,
    exports: ["kit#Button"],
  });
  expect(capture.node).toMatchObject({
    key: "story:actions-button--primary",
    type: "COMPONENT",
    width: 120,
    height: 44,
    x: 0,
    y: 0,
  });
  expect(capture.diagnostics).toContainEqual(
    expect.objectContaining({ severity: "error", code: "CSS_MASK" }),
  );
});

test("focus outlines escape the element clip while overflowing content stays clipped", () => {
  const style = {
    display: "block",
    opacity: "0.5",
    "background-color": "rgb(0, 0, 255)",
    "background-image": "none",
    "overflow-x": "hidden",
    "overflow-y": "hidden",
    "outline-width": "3px",
    "outline-offset": "4px",
    "outline-style": "solid",
    "outline-color": "rgb(255, 0, 0)",
    "border-top-left-radius": "22px",
    "border-top-right-radius": "18px",
    "border-bottom-right-radius": "14px",
    "border-bottom-left-radius": "10px",
  };
  const raw = {
    bounds: { x: 0, y: 0, width: 400, height: 300 },
    background: style,
    diagnostics: [],
    colors,
    hasPortal: false,
    fontFaces: [],
    children: [
      {
        key: "button",
        name: "Button",
        tag: "button",
        bounds: { x: 20, y: 20, width: 120, height: 44 },
        style,
        source: {},
        children: [
          {
            key: "button/media",
            name: "Oversized content",
            tag: "div",
            bounds: { x: 10, y: 10, width: 140, height: 64 },
            style: { display: "block", opacity: "1", "background-image": "none" },
            source: {},
            children: [],
          },
        ],
      },
    ],
  };
  const { node } = normalizeCapture(raw, {
    id: "button--focused",
    name: "Focused",
    width: 1440,
    family: "button",
    kind: "component",
  });
  expect(node).toMatchObject({
    key: "story:button--focused",
    width: 120,
    height: 44,
    opacity: 0.5,
    clipsContent: false,
    fills: [],
  });
  expect(node.children).toHaveLength(2);
  expect(node.children[0]).toMatchObject({
    key: "button/content-clip",
    clipsContent: true,
    opacity: 1,
    width: 120,
    height: 44,
    layoutSizingHorizontal: "FILL",
    layoutSizingVertical: "FILL",
  });
  expect(node.children[0].children[0]).toMatchObject({
    key: "button/media",
    x: -10,
    y: -10,
    width: 140,
    height: 64,
  });
  expect(node.children[1]).toMatchObject({
    key: "button/outline",
    layoutPositioning: "ABSOLUTE",
    x: -7,
    y: -7,
    width: 134,
    height: 58,
    topLeftRadius: 29,
    topRightRadius: 25,
    bottomRightRadius: 21,
    bottomLeftRadius: 17,
  });
});

test("background sizing preserves hidden underlines and repeated rail tiles", () => {
  expect(
    backgroundTiles(
      {
        "background-size": "0% 1px",
        "background-position": "0px 100%",
        "background-repeat": "no-repeat",
      },
      { width: 150, height: 24 },
    ),
  ).toEqual([]);
  expect(
    backgroundTiles(
      {
        "background-size": "100% 1px",
        "background-position": "0px 100%",
        "background-repeat": "no-repeat",
      },
      { width: 150, height: 24 },
    ),
  ).toEqual([{ x: 0, y: 23, width: 150, height: 1 }]);
  const tiles = backgroundTiles(
    {
      "background-size": "10px 2px",
      "background-position": "0% 0%",
      "background-repeat": "repeat",
    },
    { width: 100, height: 2 },
  );
  expect(tiles).toHaveLength(10);
  expect(tiles[0]).toEqual({ x: 0, y: 0, width: 10, height: 2 });
  expect(tiles[9]).toEqual({ x: 90, y: 0, width: 10, height: 2 });
});

test("zero-size gradients do not cover text and repeated gradients remain native tiles", () => {
  const style = {
    display: "block",
    opacity: "1",
    "background-color": "transparent",
    "background-image": "linear-gradient(rgb(255, 0, 0), transparent)",
    "background-size": "0% 1px",
    "background-position": "0px 100%",
    "background-repeat": "no-repeat",
  };
  const raw = {
    bounds: { x: 0, y: 0, width: 100, height: 2 },
    background: style,
    diagnostics: [],
    colors,
    hasPortal: false,
    fontFaces: [],
    children: [
      {
        key: "rail",
        name: "Rail",
        tag: "div",
        bounds: { x: 0, y: 0, width: 100, height: 2 },
        style,
        source: {},
        children: [],
      },
    ],
  };
  const story = {
    id: "rail--default",
    name: "Default",
    width: 1440,
    family: "rail",
    kind: "component",
  };
  expect(normalizeCapture(raw, story).node.fills).toEqual([]);
  raw.children[0]!.style = {
    ...style,
    "background-size": "10px 2px",
    "background-position": "0% 0%",
    "background-repeat": "repeat",
  };
  const { node, diagnostics } = normalizeCapture(raw, story);
  expect(diagnostics).toEqual([]);
  expect(node.fills).toEqual([]);
  expect(node.children[0]).toMatchObject({ clipsContent: true, width: 100, height: 2 });
  expect(node.children[0].children).toHaveLength(10);
  expect(node.children[0].children[9]).toMatchObject({
    type: "RECTANGLE",
    x: 90,
    width: 10,
    fills: [{ type: "GRADIENT_LINEAR" }],
  });
});
