/** Versioned, renderer-independent native scene contract. No screenshot fallbacks. */
export const SCENE_VERSION = 1;
export const NODE_TYPES = [
  "FRAME",
  "COMPONENT",
  "COMPONENT_SET",
  "TEXT",
  "RECTANGLE",
  "ELLIPSE",
  "SVG",
];
export const NODE_FIELDS = [
  "key",
  "name",
  "type",
  "width",
  "height",
  "x",
  "y",
  "children",
  "layout",
  "fills",
  "strokes",
  "strokeWeight",
  "strokeAlign",
  "strokeTopWeight",
  "strokeRightWeight",
  "strokeBottomWeight",
  "strokeLeftWeight",
  "cornerRadius",
  "topLeftRadius",
  "topRightRadius",
  "bottomLeftRadius",
  "bottomRightRadius",
  "opacity",
  "clipsContent",
  "visible",
  "effects",
  "text",
  "svg",
  "bindings",
  "textStyle",
  "effectStyle",
  "componentProperties",
  "propertyReferences",
  "description",
  "source",
  "layoutPositioning",
  "layoutSizingHorizontal",
  "layoutSizingVertical",
  "variableModes",
  "rotation",
  "blendMode",
  "dashPattern",
  "isMask",
  "maskType",
];
const LAYOUT_FIELDS = [
  "mode",
  "wrap",
  "gap",
  "counterAxisSpacing",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "primaryAxisSizingMode",
  "counterAxisSizingMode",
];
const TEXT_FIELDS = [
  "characters",
  "fontName",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "textAlignHorizontal",
  "textAlignVertical",
  "textAutoResize",
  "textCase",
  "textDecoration",
  "paragraphSpacing",
  "paragraphIndent",
  "ranges",
];
const forbidden = new Set(["__proto__", "prototype", "constructor"]);
const finite = (n) => typeof n === "number" && Number.isFinite(n);
function assert(condition, message) {
  if (!condition) throw new Error(`Invalid Figma scene: ${message}`);
}
function fields(object, allowed, path) {
  assert(
    object && typeof object === "object" && !Array.isArray(object),
    `${path} must be an object`,
  );
  for (const key of Object.keys(object))
    assert(allowed.includes(key), `${path}.${key} is unsupported`);
}
function string(value, path) {
  assert(typeof value === "string" && value.length > 0, `${path} must be a nonempty string`);
}
function font(value, path) {
  fields(value, ["family", "style"], path);
  string(value.family, `${path}.family`);
  string(value.style, `${path}.style`);
}
function color(value, path, alpha = false) {
  fields(value, alpha ? ["r", "g", "b", "a"] : ["r", "g", "b"], path);
  for (const channel of ["r", "g", "b", ...(alpha && value.a !== undefined ? ["a"] : [])])
    assert(
      finite(value[channel]) && value[channel] >= 0 && value[channel] <= 1,
      `${path}.${channel} must be 0..1`,
    );
}
/** Throws before any Figma mutation when fidelity, identities or references are invalid. */
export function validateScene(scene) {
  fields(
    scene,
    [
      "schemaVersion",
      "package",
      "release",
      "collections",
      "variables",
      "textStyles",
      "effectStyles",
      "pages",
      "diagnostics",
      "source",
    ],
    "scene",
  );
  assert(scene.schemaVersion === SCENE_VERSION, `schemaVersion must be ${SCENE_VERSION}`);
  string(scene.package, "package");
  fields(scene.release, ["version", "commit"], "release");
  string(scene.release.version, "release.version");
  string(scene.release.commit, "release.commit");
  const all = new Map();
  const add = (item, kind) => {
    string(item.key, `${kind}.key`);
    assert(!forbidden.has(item.key), `reserved key ${item.key}`);
    assert(!all.has(item.key), `duplicate key ${item.key}`);
    all.set(item.key, { ...item, kind });
    string(item.name, `${item.key}.name`);
  };
  const refs = [];
  const ref = (key, kinds, path) => {
    string(key, path);
    refs.push({ key, kinds, path });
  };
  const paint = (p, path) => {
    assert(p && typeof p === "object", `${path} must be paint`);
    if (p.type === "SOLID") {
      fields(p, ["type", "color", "opacity", "visible", "blendMode", "variable"], path);
      color(p.color, path);
      if (p.variable) ref(p.variable, ["variable"], path);
    } else if (
      ["GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"].includes(
        p.type,
      )
    ) {
      fields(
        p,
        ["type", "gradientTransform", "gradientStops", "opacity", "visible", "blendMode"],
        path,
      );
      assert(
        p.gradientTransform?.length === 2 &&
          p.gradientTransform.every((r) => r.length === 3 && r.every(finite)),
        `${path}.gradientTransform must be 2x3`,
      );
      assert(
        Array.isArray(p.gradientStops) && p.gradientStops.length >= 2,
        `${path} needs two stops`,
      );
      for (const s of p.gradientStops) {
        assert(finite(s.position) && s.position >= 0 && s.position <= 1, `${path} stop position`);
        color(s.color, path, true);
      }
    } else if (p.type === "IMAGE") {
      fields(
        p,
        [
          "type",
          "bytesBase64",
          "mimeType",
          "scaleMode",
          "imageTransform",
          "scalingFactor",
          "rotation",
          "opacity",
          "visible",
          "blendMode",
          "filters",
        ],
        path,
      );
      assert(
        typeof p.bytesBase64 === "string" && /^[A-Za-z0-9+/]+={0,2}$/.test(p.bytesBase64),
        `${path} IMAGE needs inline base64 bytes`,
      );
      assert(
        ["image/png", "image/jpeg", "image/gif"].includes(p.mimeType),
        `${path} unsupported native image MIME ${p.mimeType}`,
      );
      assert(["FILL", "FIT", "CROP", "TILE"].includes(p.scaleMode), `${path} invalid scaleMode`);
    } else assert(false, `${path} unsupported paint ${p.type}`);
    if (p.opacity !== undefined)
      assert(finite(p.opacity) && p.opacity >= 0 && p.opacity <= 1, `${path}.opacity must be 0..1`);
  };
  for (const c of scene.collections ?? []) {
    fields(c, ["key", "name", "modes", "source"], "collection");
    add(c, "collection");
    assert(
      Array.isArray(c.modes) && c.modes.length > 0 && new Set(c.modes).size === c.modes.length,
      `${c.key} needs unique modes`,
    );
    c.modes.forEach((m) => string(m, `${c.key}.mode`));
  }
  for (const v of scene.variables ?? []) {
    fields(
      v,
      [
        "key",
        "collection",
        "name",
        "type",
        "scopes",
        "codeSyntax",
        "values",
        "description",
        "source",
      ],
      "variable",
    );
    add(v, "variable");
    ref(v.collection, ["collection"], v.key);
    assert(
      ["COLOR", "FLOAT", "STRING", "BOOLEAN"].includes(v.type),
      `${v.key} invalid variable type`,
    );
    assert(
      Array.isArray(v.scopes) && !v.scopes.includes("ALL_SCOPES"),
      `${v.key} requires explicit scopes`,
    );
    assert(
      typeof v.codeSyntax?.WEB === "string" && /^var\(--[\w-]+\)$/.test(v.codeSyntax.WEB),
      `${v.key} requires WEB var(--css-token) syntax`,
    );
    assert(v.values && typeof v.values === "object", `${v.key} needs values by mode`);
    for (const value of Object.values(v.values)) {
      if (value && typeof value === "object" && "alias" in value)
        ref(value.alias, ["variable"], v.key);
      else if (v.type === "COLOR") color(value, v.key, true);
      else
        assert(
          v.type === "FLOAT" ? finite(value) : typeof value === v.type.toLowerCase(),
          `${v.key} invalid ${v.type} value`,
        );
    }
  }
  for (const s of scene.textStyles ?? []) {
    fields(
      s,
      [
        "key",
        "name",
        "fontName",
        "fontSize",
        "lineHeight",
        "letterSpacing",
        "textCase",
        "textDecoration",
        "description",
        "source",
      ],
      "textStyle",
    );
    add(s, "textStyle");
    font(s.fontName, s.key);
    assert(finite(s.fontSize) && s.fontSize > 0, `${s.key} invalid font size`);
  }
  for (const s of scene.effectStyles ?? []) {
    fields(s, ["key", "name", "effects", "description", "source"], "effectStyle");
    add(s, "effectStyle");
    assert(Array.isArray(s.effects), `${s.key} needs effects`);
  }
  const walk = (n, parent) => {
    fields(n, NODE_FIELDS, "node");
    add(n, "node");
    assert(NODE_TYPES.includes(n.type), `${n.key} unsupported type ${n.type}`);
    assert(
      finite(n.width) && n.width > 0 && finite(n.height) && n.height > 0,
      `${n.key} needs positive bounds`,
    );
    if (n.type === "TEXT") {
      fields(n.text, TEXT_FIELDS, `${n.key}.text`);
      assert(typeof n.text.characters === "string", `${n.key} text characters missing`);
      font(n.text.fontName, n.key);
      assert(finite(n.text.fontSize) && n.text.fontSize > 0, `${n.key} invalid font size`);
    } else assert(n.text === undefined, `${n.key} text requires TEXT`);
    for (const range of n.text?.ranges ?? []) {
      fields(
        range,
        [
          "start",
          "end",
          "fontName",
          "fontSize",
          "lineHeight",
          "letterSpacing",
          "fills",
          "textDecoration",
          "textCase",
        ],
        `${n.key}.text.ranges`,
      );
      assert(
        Number.isInteger(range.start) &&
          Number.isInteger(range.end) &&
          range.start >= 0 &&
          range.end > range.start &&
          range.end <= n.text.characters.length,
        `${n.key} invalid text range`,
      );
      if (range.fontName) font(range.fontName, n.key);
      for (const fill of range.fills ?? []) paint(fill, `${n.key}.text.range.fills`);
    }
    if (n.type === "SVG") {
      string(n.svg, `${n.key}.svg`);
      assert(
        !/<(?:image|foreignObject|script)\b/i.test(n.svg),
        `${n.key} SVG must contain native vectors only`,
      );
    }
    if (n.layout) {
      fields(n.layout, LAYOUT_FIELDS, `${n.key}.layout`);
      assert(
        ["FRAME", "COMPONENT", "COMPONENT_SET"].includes(n.type),
        `${n.key} layout requires a container`,
      );
      assert(["HORIZONTAL", "VERTICAL"].includes(n.layout.mode), `${n.key} invalid layout mode`);
    }
    for (const key of [
      "x",
      "y",
      "rotation",
      "strokeWeight",
      "strokeTopWeight",
      "strokeBottomWeight",
      "strokeLeftWeight",
      "strokeRightWeight",
      "cornerRadius",
      "topLeftRadius",
      "topRightRadius",
      "bottomLeftRadius",
      "bottomRightRadius",
      "opacity",
    ])
      if (n[key] !== undefined) assert(finite(n[key]), `${n.key}.${key} must be finite`);
    for (const key of ["fills", "strokes"])
      if (n[key]) {
        assert(Array.isArray(n[key]), `${n.key}.${key} must be array`);
        n[key].forEach((p) => paint(p, `${n.key}.${key}`));
      }
    for (const [field, variable] of Object.entries(n.bindings ?? {})) {
      assert(
        [
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "itemSpacing",
          "counterAxisSpacing",
          "cornerRadius",
          "topLeftRadius",
          "topRightRadius",
          "bottomLeftRadius",
          "bottomRightRadius",
          "strokeWeight",
          "fontSize",
          "lineHeight",
          "letterSpacing",
          "opacity",
          "width",
          "height",
          "minWidth",
          "maxWidth",
          "minHeight",
          "maxHeight",
        ].includes(field),
        `${n.key} unsupported binding ${field}`,
      );
      ref(variable, ["variable"], n.key);
    }
    if (n.textStyle) {
      assert(n.type === "TEXT", `${n.key} textStyle requires TEXT`);
      ref(n.textStyle, ["textStyle"], n.key);
    }
    if (n.effectStyle) ref(n.effectStyle, ["effectStyle"], n.key);
    if (n.description || n.componentProperties)
      assert(
        ["COMPONENT", "COMPONENT_SET"].includes(n.type),
        `${n.key} component metadata requires component`,
      );
    for (const p of n.componentProperties ?? []) {
      fields(p, ["key", "name", "type", "defaultValue"], `${n.key}.componentProperties`);
      add(p, "property");
      assert(["TEXT", "BOOLEAN"].includes(p.type), `${p.key} unsupported property type`);
      assert(
        typeof p.defaultValue === (p.type === "TEXT" ? "string" : "boolean"),
        `${p.key} invalid default value`,
      );
    }
    if (n.propertyReferences) {
      fields(n.propertyReferences, ["characters", "visible"], `${n.key}.propertyReferences`);
      for (const p of Object.values(n.propertyReferences)) ref(p, ["property"], n.key);
    }
    for (const [collection, mode] of Object.entries(n.variableModes ?? {})) {
      ref(collection, ["collection"], n.key);
      assert(
        (scene.collections ?? []).some((c) => c.key === collection && c.modes.includes(mode)),
        `${n.key} unknown mode ${mode}`,
      );
    }
    if (n.type === "COMPONENT_SET")
      assert(
        n.children?.length > 0 &&
          n.children.every((c) => c.type === "COMPONENT" && c.name.includes("=")),
        `${n.key} variants must be named components`,
      );
    if (n.componentProperties && parent?.type === "COMPONENT_SET")
      assert(false, `${n.key} properties belong on the component set`);
    for (const sizing of ["layoutSizingHorizontal", "layoutSizingVertical"]) {
      if (n[sizing] === "FILL")
        assert(
          parent?.layout && n.layoutPositioning !== "ABSOLUTE",
          `${n.key} FILL needs Auto Layout parent`,
        );
      if (n[sizing] === "HUG")
        assert(n.layout || (n.type === "TEXT" && parent?.layout), `${n.key} HUG needs Auto Layout`);
    }
    const names = new Set();
    for (const child of n.children ?? []) {
      assert(
        !names.has(child.name),
        `${n.key} duplicate child name ${child.name} cannot be recovered safely`,
      );
      names.add(child.name);
      walk(child, n);
    }
  };
  assert(Array.isArray(scene.pages) && scene.pages.length > 0, "pages required");
  for (const p of scene.pages) {
    fields(p, ["key", "name", "children", "source"], "page");
    add(p, "page");
    assert(Array.isArray(p.children), `${p.key} children required`);
    const names = new Set();
    for (const n of p.children) {
      assert(!names.has(n.name), `${p.key} duplicate child name ${n.name}`);
      names.add(n.name);
      walk(n, p);
    }
  }
  for (const r of refs)
    assert(
      r.kinds.includes(all.get(r.key)?.kind),
      `${r.path} missing or wrong-kind reference ${r.key}`,
    );
  for (const v of scene.variables ?? []) {
    const c = all.get(v.collection);
    assert(
      c.modes.every((m) => Object.hasOwn(v.values, m)) &&
        Object.keys(v.values).every((m) => c.modes.includes(m)),
      `${v.key} values must cover exactly its collection modes`,
    );
    for (const value of Object.values(v.values))
      if (value?.alias)
        assert(all.get(value.alias).type === v.type, `${v.key} alias has incompatible type`);
  }
  const visiting = new Set(),
    visited = new Set();
  const visit = (key) => {
    assert(!visiting.has(key), `cyclic variable alias at ${key}`);
    if (visited.has(key)) return;
    visiting.add(key);
    for (const v of Object.values(all.get(key).values)) if (v?.alias) visit(v.alias);
    visiting.delete(key);
    visited.add(key);
  };
  for (const v of scene.variables ?? []) visit(v.key);
  const errors = (scene.diagnostics ?? []).filter((d) => d.severity === "error");
  assert(
    errors.length === 0,
    `mandatory fidelity failures: ${errors.map((d) => `${d.code}: ${d.message}`).join("; ")}`,
  );
  return scene;
}
