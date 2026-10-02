import { expect, test } from "vitest";

// @ts-expect-error The production release organizer is plain ESM.
import { organizeLibrary } from "../scripts/figma-library.mjs";

test("native variant grouping keeps story identities and separates multi-control examples", () => {
  const make = (id: string, tag: string) => ({
    key: `story:${id}`,
    name: `button / ${id}`,
    type: "COMPONENT",
    width: 100,
    height: 44,
    source: { storyId: id, rootTag: tag },
    children: [],
  });
  const primary = make("primary", "button"),
    secondary = make("secondary", "button"),
    examples = make("icons", "div");
  const scene = {
    variables: [],
    textStyles: [],
    effectStyles: [],
    source: {
      inventory: ["primary", "secondary", "icons"].map((id) => ({
        id,
        family: "actions-button",
        kind: "component",
        name: id,
        width: 1440,
      })),
    },
    pages: [{ children: [primary, secondary, examples] }],
  };
  organizeLibrary(scene);
  expect(scene.pages[0].children).toHaveLength(2);
  const set = scene.pages[0].children[0];
  expect(set.type).toBe("COMPONENT_SET");
  expect(set.key).toBe("family:actions-button");
  expect(set.children.map((n: { key: string }) => n.key)).toEqual([
    "story:primary",
    "story:secondary",
  ]);
  expect(scene.pages[0].children[1]).toBe(examples);
  expect(primary.name).toBe("Story=primary");
});

test("derived color variables preserve source opacity in every tone instead of losing it on Figma binding", () => {
  const paint = {
    type: "SOLID",
    color: { r: 0, g: 0, b: 0 },
    opacity: 0.07,
    variable: "css:--tone-fg",
  };
  const variable = {
    key: "css:--tone-fg",
    collection: "tones",
    name: "tone/fg",
    type: "COLOR",
    scopes: ["FRAME_FILL"],
    codeSyntax: { WEB: "var(--tone-fg)" },
    values: { paper: { r: 0, g: 0, b: 0, a: 1 }, ink: { r: 1, g: 1, b: 1, a: 1 } },
  };
  const node = {
    key: "button",
    name: "Button",
    type: "COMPONENT",
    fills: [paint],
    variableModes: { tones: "paper" },
    source: { storyId: "primary" },
    children: [],
  };
  const scene = {
    collections: [{ key: "tones", modes: ["paper", "ink"] }],
    variables: [variable],
    textStyles: [],
    effectStyles: [],
    source: { inventory: [{ id: "primary", family: "button", kind: "component", width: 1440 }] },
    pages: [{ children: [node] }],
  };
  organizeLibrary(scene);
  expect(paint.variable).toBe("derived:css:--tone-fg:alpha:0.07");
  const derived = scene.variables.find((v) => v.key === paint.variable)!;
  expect(derived.values.paper).toEqual({ r: 0, g: 0, b: 0, a: 0.07 });
  expect(derived.values.ink).toEqual({ r: 1, g: 1, b: 1, a: 0.07 });
  expect(variable.values.paper.a).toBe(1);
});
