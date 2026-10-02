/** Attach source-proven tokens/styles and group compatible authored states into native variants. */
export function organizeLibrary(scene) {
  const inventory = new Map(scene.source.inventory.map((story) => [story.id, story]));
  const variables = new Set(scene.variables.map((variable) => variable.key));
  const byKey = new Map(scene.variables.map((variable) => [variable.key, variable]));
  const collections = new Map(
    (scene.collections ?? []).map((collection) => [collection.key, collection]),
  );
  const colorAt = (key, modes) => {
    const variable = byKey.get(key);
    if (!variable || variable.type !== "COLOR") throw new Error(`Invalid paint variable ${key}`);
    const collection = collections.get(variable.collection);
    const value = variable.values[modes[collection.key] ?? collection.modes[0]];
    return value.alias ? colorAt(value.alias, modes) : value;
  };
  function bindPaintAlpha(paint, node) {
    if (!paint.variable) return;
    const base = byKey.get(paint.variable),
      modes = node.variableModes ?? {};
    const original = colorAt(base.key, modes),
      opacity = paint.opacity ?? 1;
    if (Math.abs(opacity - original.a) < 1 / 255) return;
    if (!original.a) throw new Error(`Cannot derive nonzero opacity from transparent ${base.key}`);
    const factor = Math.round((opacity / original.a) * 1e6) / 1e6;
    const key = `derived:${base.key}:alpha:${factor}`;
    if (!byKey.has(key)) {
      const collection = collections.get(base.collection);
      const values = Object.fromEntries(
        collection.modes.map((mode) => {
          const color = colorAt(base.key, { ...modes, [collection.key]: mode });
          return [mode, { ...color, a: Math.min(1, Math.max(0, color.a * factor)) }];
        }),
      );
      const variable = {
        key,
        collection: base.collection,
        name: `derived/${base.name}/alpha/${Math.round(factor * 1e6)}ppm`,
        type: "COLOR",
        scopes: base.scopes,
        codeSyntax: base.codeSyntax,
        values,
        description: `Rendered CSS opacity modifier for ${base.key}. Figma color bindings replace paint opacity, so every mode retains its resolved RGBA value.`,
        source: {
          derivedFrom: base.key,
          opacityFactor: factor,
          proof: "computed-style-perturbation",
          cssSource: node.source?.css,
        },
      };
      scene.variables.push(variable);
      byKey.set(key, variable);
      variables.add(key);
    }
    paint.variable = key;
  }
  const typographyMatches = (node, style) =>
    JSON.stringify(node.text.fontName) === JSON.stringify(style.fontName) &&
    Math.abs(node.text.fontSize - style.fontSize) < 0.001 &&
    JSON.stringify(node.text.lineHeight) === JSON.stringify(style.lineHeight) &&
    JSON.stringify(node.text.letterSpacing) === JSON.stringify(style.letterSpacing) &&
    (node.text.textCase ?? "ORIGINAL") === (style.textCase ?? "ORIGINAL") &&
    (node.text.textDecoration ?? "NONE") === (style.textDecoration ?? "NONE");
  function bind(node, width) {
    for (const paint of [
      ...(node.fills ?? []),
      ...(node.strokes ?? []),
      ...(node.text?.ranges ?? []).flatMap((range) => range.fills ?? []),
    ])
      bindPaintAlpha(paint, node);
    if (node.type === "TEXT") {
      const style = scene.textStyles.find(
        (s) => s.source?.width === width && typographyMatches(node, s),
      );
      if (style) node.textStyle = style.key;
      const token = node.source?.tokenBindings?.find(
        (b) => b.property === "font-size" && b.proof === "computed-style-perturbation",
      );
      if (token && variables.has(`css:${token.cssVariable}`))
        node.bindings = { ...node.bindings, fontSize: `css:${token.cssVariable}` };
    }
    const effect =
      node.effects?.length &&
      scene.effectStyles.find((s) => JSON.stringify(s.effects) === JSON.stringify(node.effects));
    if (effect) node.effectStyle = effect.key;
    for (const child of node.children ?? []) bind(child, width);
  }
  for (const page of scene.pages) {
    const families = new Map();
    for (const node of page.children) {
      const story = inventory.get(node.source?.storyId);
      bind(node, story?.width ?? scene.source.canonicalWidth);
      if (!story || story.kind !== "component" || node.type !== "COMPONENT") continue;
      if (!families.has(story.family)) families.set(story.family, []);
      families.get(story.family).push(node);
    }
    for (const [family, nodes] of families) {
      const signature = (n) =>
        `${n.source?.rootTag ?? n.source?.tag ?? "unknown"}/${n.source?.rootRole ?? n.source?.role ?? "none"}`;
      const groups = new Map();
      for (const node of nodes) {
        const key = signature(node);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(node);
      }
      const compatible = [...groups.values()].sort(
        (a, b) => b.length - a.length || signature(a[0]).localeCompare(signature(b[0])),
      )[0];
      if (compatible.length < 2) continue;
      const selected = new Set(compatible);
      const firstIndex = page.children.findIndex((n) => selected.has(n));
      const set = {
        key: `family:${family}`,
        name: family,
        type: "COMPONENT_SET",
        x: 80,
        y: 0,
        width: Math.max(...compatible.map((n) => n.width)) + 64,
        height: 64,
        fills: [],
        description:
          "Authored Storybook states. Story identifies a rendered example, not the complete Cartesian product of React props.",
        source: { family, variantAxis: "Story", rootSignature: signature(compatible[0]) },
        children: compatible,
      };
      for (const node of compatible) {
        const story = inventory.get(node.source.storyId);
        node.name = `Story=${(story.name ?? node.name.split(" / ").at(-1)).replaceAll(",", " · ").replaceAll("=", "-")}`;
        node.x = 32;
        node.y = set.height;
        set.height += node.height + 48;
      }
      page.children = page.children.filter((n) => !selected.has(n));
      page.children.splice(firstIndex, 0, set);
    }
    let y = 80;
    for (const node of page.children) {
      node.x = 80;
      node.y = y;
      y += node.height + 120;
    }
  }
  return scene;
}
