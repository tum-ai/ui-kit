import { describe, expect, test } from "vitest";

import { formatFigure, parseFigure } from "./figure";

describe("parseFigure", () => {
  test.each([
    ["1.2M+", { prefix: "", value: 1.2, decimals: 1, grouping: false, suffix: "M+" }],
    ["20k+", { prefix: "", value: 20, decimals: 0, grouping: false, suffix: "k+" }],
    ["2.3%", { prefix: "", value: 2.3, decimals: 1, grouping: false, suffix: "%" }],
    ["~500", { prefix: "~", value: 500, decimals: 0, grouping: false, suffix: "" }],
    ["2,100+", { prefix: "", value: 2100, decimals: 0, grouping: true, suffix: "+" }],
    ["+1000", { prefix: "+", value: 1000, decimals: 0, grouping: false, suffix: "" }],
    ["€4.5M", { prefix: "€", value: 4.5, decimals: 1, grouping: false, suffix: "M" }],
  ])("splits %s", (text, expected) => {
    expect(parseFigure(text)).toEqual(expected);
  });

  test.each(["2019–2024", "24/7", "many", ""])("leaves %j alone (no single number)", (text) => {
    expect(parseFigure(text)).toBeNull();
  });
});

describe("figure formatting", () => {
  test.each([
    [1250, { prefix: "€", suffix: "+", decimals: 0, grouping: true }, "€1,250+"],
    [12.3, { prefix: "~", suffix: "%", decimals: 2, grouping: false }, "~12.30%"],
    [2100, { prefix: "", suffix: "", decimals: 0, grouping: false }, "2100"],
    [1.26, { prefix: "", suffix: "M+", decimals: 1, grouping: false }, "1.3M+"],
    [0, { prefix: "", suffix: "k+", decimals: 1, grouping: true }, "0.0k+"],
  ])("formats %s as %s", (value, shape, expected) => {
    expect(formatFigure(value, shape)).toBe(expected);
  });

  test("keeps source precision and grouping after parsing", () => {
    const parsed = parseFigure("  €12,345.60M+  ");
    expect(parsed).toEqual({
      prefix: "€",
      value: 12345.6,
      decimals: 2,
      grouping: true,
      suffix: "M+",
    });
    expect(formatFigure(parsed!.value, parsed!)).toBe("€12,345.60M+");
  });

  test.each(["1,20", "2.3.4", "1 of 3", "3,000 - 5,000"])(
    "does not reinterpret ambiguous figure %s",
    (value) => {
      expect(parseFigure(value)).toBeNull();
    },
  );
});
