import { describe, expect, test } from "vitest";

// @ts-expect-error The token compiler is portable build-time ESM.
import { buildFoundations, TONES } from "../scripts/figma-tokens.mjs";

type Value = {
  type: string;
  value: unknown;
  source: { cssName: string; expression: string; scope: string };
};
function contexts() {
  return [320, 1440].flatMap((width) =>
    (TONES as string[]).map((tone) => {
      const entry = (
        name: string,
        type: string,
        value: unknown,
        expression = String(value),
      ): Value => ({ type, value, source: { cssName: name, expression, scope: ":root" } });
      const white = { r: 1, g: 1, b: 1, a: 1 };
      const black = { r: 0, g: 0, b: 0, a: 1 };
      return {
        width,
        tone,
        values: {
          "--color-white": entry("--color-white", "COLOR", white, "#fff"),
          "--tone-fg": entry(
            "--tone-fg",
            "COLOR",
            tone === "ink" ? white : black,
            tone === "ink" ? "var(--color-white)" : "#000",
          ),
          "--text-display": entry(
            "--text-display",
            "FLOAT",
            width === 320 ? 32 : 64,
            "clamp(2rem, 5vw, 4rem)",
          ),
          "--text-display--font-weight": entry("--text-display--font-weight", "FLOAT", 600),
          "--text-display--line-height": entry(
            "--text-display--line-height",
            "FLOAT",
            width === 320 ? 40 : 80,
            "1.25",
          ),
        },
      };
    }),
  );
}

describe("native token foundations", () => {
  test("keeps six tone modes, viewport readings, source expressions and actual alias relationships", () => {
    const foundations = buildFoundations(contexts());
    const find = (key: string) => foundations.variables.find((v: { key: string }) => v.key === key);
    expect(find("css:--tone-fg").collection).toBe("collection:tones");
    expect(find("css:--tone-fg").values.ink).toEqual({ alias: "css:--color-white" });
    expect(find("css:--text-display").values).toEqual({ "320": 32, "1440": 64 });
    expect(find("css:--text-display").source.contexts[320].expression).toBe(
      "clamp(2rem, 5vw, 4rem)",
    );
    expect(foundations.textStyles[0].fontName).toEqual({ family: "Manrope", style: "SemiBold" });
    expect(
      foundations.textStyles.map((s: { lineHeight: { value: number } }) => s.lineHeight.value),
    ).toEqual([40, 80]);
  });
  test("literal primitive IDs stay stable when another semantic token sorts earlier", () => {
    const base = contexts();
    const before = buildFoundations(base).variables.find(
      (v: { key: string }) => v.key === "css:--tone-fg",
    ).values.paper.alias;
    for (const c of base)
      Object.assign(c.values, {
        "--tone-accent": {
          ...c.values["--tone-fg"],
          source: { ...c.values["--tone-fg"].source, cssName: "--tone-accent" },
        },
      });
    expect(
      buildFoundations(base).variables.find((v: { key: string }) => v.key === "css:--tone-fg")
        .values.paper.alias,
    ).toBe(before);
  });
  test("does not flatten missing contexts or values that vary on two axes", () => {
    expect(() => buildFoundations(contexts().slice(1))).toThrow("Missing token context");
    const base = contexts();
    base[0].values["--text-display"].value = 31;
    expect(() => buildFoundations(base)).toThrow("varies on both axes");
  });
});
