import { shadowEffects } from "./figma/normalize.mjs";

export const TONES = ["paper", "mist", "lavender", "ink", "night", "violet"];
export const REFERENCE_WIDTHS = [320, 390, 768, 1440];

/** Resolve expressions in Chromium, retaining CSS expressions and context rather than flattening fluid tokens. */
export async function resolveTokenContexts(
  page,
  manifest,
  { baseUrl, widths = REFERENCE_WIDTHS } = {},
) {
  await page.goto(`${baseUrl}/iframe.html?id=foundations-tones--all-tones&viewMode=story`);
  await page.waitForFunction(() => document.body.dataset.kitReady === "true");
  const contexts = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const tone of TONES) {
      const values = await page.evaluate(
        ({ tokens, tone }) => {
          const root = document.querySelector("#app-root");
          if (!root) throw new Error("Token specimen root missing");
          root.setAttribute("data-tone", tone);
          const probe = document.createElement("span");
          probe.style.cssText =
            "position:absolute;visibility:hidden;font-size:16px;line-height:normal;letter-spacing:normal";
          root.append(probe);
          const applicable = tokens.filter(
            (t) =>
              t.scope.startsWith("@theme") ||
              t.scope
                .split(",")
                .some((selector) => [":root", `[data-tone="${tone}"]`].includes(selector.trim())),
          );
          const definitions = new Map(applicable.map((t) => [t.name, t]));
          for (const token of applicable) probe.style.setProperty(token.name, token.value);
          const names = new Set([...definitions.keys(), ...applicable.flatMap((t) => t.aliases)]);
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          const rgba = (value) => {
            if (!CSS.supports("color", value)) return null;
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
          };
          const result = {};
          for (const name of names) {
            probe.style.fontSize = "16px";
            probe.style.lineHeight = "normal";
            probe.style.letterSpacing = "normal";
            probe.style.width = "auto";
            const raw = getComputedStyle(probe).getPropertyValue(name).trim();
            if (!raw) continue; // Optional font-loader variable is deliberately absent when CSS supplies its fallback.
            const expression = definitions.get(name)?.value ?? raw;
            const source = {
              cssName: name,
              expression,
              scope: definitions.get(name)?.scope ?? "inherited Tailwind foundation",
            };
            let type = "STRING",
              value = raw;
            const color = rgba(raw);
            if (color) {
              type = "COLOR";
              value = color;
            } else if (/^--text-.+--font-weight$/.test(name)) {
              type = "FLOAT";
              value = Number(raw);
            } else if (/^--text-.+--(?:line-height|letter-spacing)$/.test(name)) {
              const base = name.replace(/--(?:line-height|letter-spacing)$/, "");
              probe.style.fontSize = `var(${base})`;
              const property = name.endsWith("--line-height") ? "lineHeight" : "letterSpacing";
              probe.style[property] = `var(${name})`;
              const computed = getComputedStyle(probe)[property];
              if (computed !== "normal") {
                type = "FLOAT";
                value = parseFloat(computed);
              }
            } else if (/^--text-[^-].*/.test(name) && !name.slice(2).includes("--")) {
              probe.style.fontSize = `var(${name})`;
              type = "FLOAT";
              value = parseFloat(getComputedStyle(probe).fontSize);
            } else if (/^--(?:radius-|gutter$|header-|spacing)/.test(name)) {
              probe.style.width = `var(${name})`;
              type = "FLOAT";
              value = parseFloat(getComputedStyle(probe).width);
            }
            if (type === "FLOAT" && !Number.isFinite(value))
              throw new Error(`Could not resolve ${name}: ${raw}`);
            result[name] = { type, value, source };
            if (name.startsWith("--shadow-")) {
              probe.style.boxShadow = `var(${name})`;
              const shadow = getComputedStyle(probe).boxShadow;
              const colors = Object.fromEntries(
                (shadow.match(/rgba?\([^)]*\)/g) ?? []).map((c) => [c, rgba(c)]),
              );
              result[name].shadow = { value: shadow, colors };
              probe.style.boxShadow = "none";
            }
          }
          probe.remove();
          return result;
        },
        { tokens: manifest.tokens, tone },
      );
      contexts.push({ width, tone, values });
    }
  }
  return contexts;
}

function scopes(name, type) {
  if (type === "COLOR") {
    if (name.startsWith("--color-")) return [];
    if (name.includes("hairline") || name.includes("focus")) return ["STROKE_COLOR"];
    if (name.includes("-fg")) return ["TEXT_FILL"];
    return ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"];
  }
  if (type !== "FLOAT") return [];
  if (name.includes("radius")) return ["CORNER_RADIUS"];
  if (name.endsWith("--line-height")) return ["LINE_HEIGHT"];
  if (name.endsWith("--letter-spacing")) return ["LETTER_SPACING"];
  if (name.endsWith("--font-weight")) return ["FONT_WEIGHT"];
  if (name.startsWith("--text-")) return ["FONT_SIZE"];
  return ["GAP", "WIDTH_HEIGHT"];
}
const same = (values) => values.every((v) => JSON.stringify(v) === JSON.stringify(values[0]));
const fontStyles = {
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
};

/** Pure transformation: all aliases require an actual CSS reference, never an equal-color guess. */
export function buildFoundations(contexts) {
  const widths = [...new Set(contexts.map((c) => c.width))].sort((a, b) => a - b);
  if (!widths.length) throw new Error("No resolved token contexts");
  for (const width of widths)
    for (const tone of TONES)
      if (!contexts.some((c) => c.width === width && c.tone === tone))
        throw new Error(`Missing token context ${width}/${tone}`);
  const names = [...new Set(contexts.flatMap((c) => Object.keys(c.values)))].sort();
  const collections = [
    { key: "collection:primitives", name: "TUM.ai / Primitives", modes: ["Value"] },
    { key: "collection:tones", name: "TUM.ai / Tones", modes: TONES },
    { key: "collection:viewport", name: "TUM.ai / Viewport", modes: widths.map(String) },
  ];
  const variables = [];
  for (const name of names) {
    const entries = contexts.map((c) => c.values[name]);
    if (entries.some((v) => !v)) throw new Error(`Token ${name} is missing from some contexts`);
    const type = entries[0].type;
    if (entries.some((v) => v.type !== type))
      throw new Error(`Token ${name} changes type across contexts`);
    const variesByTone = widths.some(
      (width) => !same(contexts.filter((c) => c.width === width).map((c) => c.values[name].value)),
    );
    const variesByWidth = TONES.some(
      (tone) => !same(contexts.filter((c) => c.tone === tone).map((c) => c.values[name].value)),
    );
    if (variesByTone && variesByWidth)
      throw new Error(`Token ${name} varies on both axes; define an explicit combined model`);
    // Tone semantics remain switchable even where two current modes happen to share a value.
    const tonal = name.startsWith("--tone-") && !TONES.some((t) => name === `--tone-${t}`);
    const collection =
      tonal || variesByTone
        ? "collection:tones"
        : variesByWidth
          ? "collection:viewport"
          : "collection:primitives";
    const modes = collections.find((c) => c.key === collection).modes;
    const values = {},
      sources = {};
    for (const mode of modes) {
      const context = contexts.find(
        (c) =>
          (collection !== "collection:tones" || c.tone === mode) &&
          (collection !== "collection:viewport" || c.width === Number(mode)),
      );
      const entry = context.values[name];
      values[mode] = entry.value;
      sources[mode] = entry.source;
    }
    variables.push({
      key: `css:${name}`,
      collection,
      name: name.slice(2).replaceAll("--", "/").replaceAll("-", "/"),
      type,
      scopes: scopes(name, type),
      codeSyntax: { WEB: `var(${name})` },
      values,
      description: `Source ${name}; expressions and viewport/tone readings retained in generation source.`,
      source: { cssName: name, contexts: sources },
    });
  }
  for (const variable of variables)
    for (const [mode, source] of Object.entries(variable.source.contexts)) {
      const match = source.expression.match(/^var\((--[\w-]+)\)$/);
      const target = match && variables.find((v) => v.key === `css:${match[1]}`);
      if (target?.type === variable.type) variable.values[mode] = { alias: target.key };
    }
  // Semantic literal colors are bound through explicit primitives, preserving future theme updates.
  const literalPrimitives = new Map();
  for (const variable of [...variables])
    if (variable.collection === "collection:tones" && variable.type === "COLOR") {
      for (const [mode, value] of Object.entries(variable.values))
        if (!value.alias) {
          const colorKey = JSON.stringify(value);
          let key = literalPrimitives.get(colorKey);
          if (!key) {
            key = `literal:rgba:${[value.r, value.g, value.b, value.a].map((v) => Math.round(v * 255)).join("-")}`;
            literalPrimitives.set(colorKey, key);
            variables.push({
              key,
              collection: "collection:primitives",
              name: `resolved/${variable.name}/${mode}`,
              type: "COLOR",
              scopes: [],
              codeSyntax: variable.codeSyntax,
              values: { Value: value },
              description: `Literal primitive from ${variable.source.cssName} (${mode}).`,
              source: variable.source.contexts[mode],
            });
          }
          variable.values[mode] = { alias: key };
        }
    }
  const textStyles = [];
  for (const width of widths) {
    const values = contexts.find((c) => c.width === width && c.tone === "paper").values;
    for (const name of names.filter((n) => n.startsWith("--text-") && !n.slice(2).includes("--"))) {
      const size = values[name];
      if (size.type !== "FLOAT") continue;
      const weight = values[`${name}--font-weight`]?.value ?? 400;
      if (!fontStyles[weight])
        throw new Error(`Manrope weight ${weight} has no verified Figma font`);
      textStyles.push({
        key: `text:${name}:${width}`,
        name: `TUM.ai / ${name.slice(7).replaceAll("-", "/")} / ${width}`,
        fontName: { family: "Manrope", style: fontStyles[weight] },
        fontSize: size.value,
        lineHeight: {
          unit: "PIXELS",
          value: values[`${name}--line-height`]?.value ?? size.value * 1.5,
        },
        letterSpacing: { unit: "PIXELS", value: values[`${name}--letter-spacing`]?.value ?? 0 },
        description: `${name} at ${width}px. ${size.source.expression}`,
        source: { cssName: name, width, expression: size.source.expression },
      });
    }
  }
  const effectStyles = [];
  for (const [name, entry] of Object.entries(contexts.find((c) => c.tone === "paper").values))
    if (entry.shadow) {
      effectStyles.push({
        key: `effect:${name}`,
        name: `TUM.ai / ${name.slice(9).replaceAll("-", "/")}`,
        effects: shadowEffects(entry.shadow.value, entry.shadow.colors),
        description: entry.source.expression,
        source: entry.source,
      });
    }
  return { collections, variables, textStyles, effectStyles };
}
