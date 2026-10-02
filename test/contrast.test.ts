/**
 * WCAG contrast of the tone tokens, computed from src/styles/tailwind.css.
 *
 * Browser stories run axe on rendered pages, but only on the combinations a
 * story happens to show. This checks every tone's text and indicator tokens
 * against its canvas and raised surface directly, so a token edit that breaks
 * AA fails in milliseconds, before any browser starts.
 */
import { readFileSync } from "node:fs";

import postcss, { type Rule } from "postcss";
import { describe, expect, test } from "vitest";

const TONES = ["paper", "mist", "lavender", "ink", "night", "violet"] as const;
type Tone = (typeof TONES)[number];

/** Tailwind's own values the kit's tokens refer to. */
const TAILWIND = new Map([["--color-white", "#ffffff"]]);

const root = postcss.parse(readFileSync("src/styles/tailwind.css", "utf8"));

/** Custom properties declared at the top level of `@theme` and in `:root`. */
const global = new Map(TAILWIND);
/** Custom properties per `[data-tone]` scope (paper is also `:root`). */
const scopes = new Map<Tone, Map<string, string>>(TONES.map((tone) => [tone, new Map()]));

root.walkAtRules("theme", (theme) => {
  theme.each((node) => {
    if (node.type === "decl" && node.prop.startsWith("--")) global.set(node.prop, node.value);
  });
});
root.walkRules((rule: Rule) => {
  const selectors = rule.selectors.map((selector) => selector.trim());
  const tones = TONES.filter((tone) => selectors.includes(`[data-tone="${tone}"]`));
  const isRoot = selectors.includes(":root");
  rule.each((node) => {
    if (node.type !== "decl" || !node.prop.startsWith("--")) return;
    if (isRoot && tones.length === 0) global.set(node.prop, node.value);
    for (const tone of tones) scopes.get(tone)?.set(node.prop, node.value);
  });
});

function resolve(tone: Tone, name: string, depth = 0): string {
  if (depth > 10) throw new Error(`Cyclic token ${name}`);
  const value = scopes.get(tone)?.get(name) ?? global.get(name);
  if (value === undefined) throw new Error(`Unknown token ${name} in ${tone}`);
  const reference = /^var\((--[\w-]+)\)$/.exec(value.trim());
  return reference?.[1] ? resolve(tone, reference[1], depth + 1) : value.trim();
}

type Rgb = [number, number, number];

/** sRGB channels in 0–1 from `#rrggbb`, `#rgb` or `oklch(L C H)`. */
function parseColor(value: string): Rgb {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
  }
  const oklch = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value);
  if (oklch) {
    const [l, c, h] = oklch.slice(1).map(Number) as Rgb;
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const linear: Rgb = [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
    ];
    return linear.map((v) => {
      const clamped = Math.min(1, Math.max(0, v));
      return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
    }) as Rgb;
  }
  throw new Error(`Unsupported color ${value}`);
}

function luminance([r, g, b]: Rgb): number {
  const linear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(tone: Tone, foreground: string, background: string): number {
  const a = luminance(parseColor(resolve(tone, foreground)));
  const b = luminance(parseColor(resolve(tone, background)));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Text: 4.5:1 (WCAG 1.4.3). Non-text indicators and focus rings: 3:1 (1.4.11). */
const TEXT = 4.5;
const NON_TEXT = 3;

const cases = TONES.flatMap((tone) => {
  // The violet band is for large type only; its subtle text reaches 3:1, not 4.5:1.
  const subtle = tone === "violet" ? NON_TEXT : TEXT;
  return [
    [tone, "--tone-fg", "--tone-canvas", TEXT],
    [tone, "--tone-fg", "--tone-raised", TEXT],
    [tone, "--tone-fg-muted", "--tone-canvas", TEXT],
    [tone, "--tone-fg-muted", "--tone-raised", TEXT],
    [tone, "--tone-fg-subtle", "--tone-canvas", subtle],
    [tone, "--tone-fg-subtle", "--tone-raised", subtle],
    [tone, "--tone-accent", "--tone-canvas", TEXT],
    [tone, "--tone-focus", "--tone-canvas", NON_TEXT],
  ] as const;
});

describe("tone contrast", () => {
  test("reads every tone from the stylesheet", () => {
    for (const tone of TONES) expect(scopes.get(tone)?.size, tone).toBeGreaterThan(8);
  });

  test.each(cases)("%s: %s on %s meets %s:1", (tone, foreground, background, minimum) => {
    expect(contrast(tone, foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});

describe("color parsing", () => {
  test("converts oklch to the sRGB value its comment names", () => {
    // --color-black: oklch(0.1275 0.0481 312.72) is #0D0214.
    const [r, g, b] = parseColor("oklch(0.1275 0.0481 312.72)").map((v) => Math.round(v * 255));
    expect([r, g, b]).toEqual([13, 2, 20]);
  });
});
