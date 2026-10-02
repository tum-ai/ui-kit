import { describe, expect, test } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  test("joins conditional class values like clsx", () => {
    expect(cn("a", false, null, undefined, ["b", { c: true, d: false }])).toBe("a b c");
  });

  test("lets the later of two conflicting stock classes win", () => {
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
  });

  test("keeps a design-system text size next to a text color", () => {
    expect(cn("text-display-xl", "text-fg")).toBe("text-display-xl text-fg");
    expect(cn("text-fg-muted", "text-stat-lg")).toBe("text-fg-muted text-stat-lg");
    expect(cn("text-white", "text-label-sm")).toBe("text-white text-label-sm");
  });

  test.each([
    ["text-heading-md", "text-heading-lg"],
    ["text-small", "text-label"],
    ["text-stat-md", "text-stat-xl"],
    ["text-[0.9375rem]", "text-label"],
    ["text-label", "text-label-sm"],
    ["text-display-lg", "text-display-fit"],
    ["text-base", "text-eyebrow"],
  ])("resolves the text sizes %s and %s", (first, second) => {
    expect(cn(first, second)).toBe(second);
  });

  test.each([
    ["bg-canvas", "bg-raised"],
    ["text-fg", "text-highlight"],
    ["border-hairline", "border-hairline-strong"],
  ])("resolves the tone colors %s and %s", (first, second) => {
    expect(cn(first, second)).toBe(second);
  });

  test.each([
    ["shadow-soft", "shadow-lift"],
    ["shadow-md", "shadow-inset-hairline"],
    ["rounded-3xl", "rounded-signature"],
    ["rounded-4xl", "rounded-5xl"],
    ["ease-in-out", "ease-brand"],
    ["ease-brand", "ease-snappy"],
    ["animate-pulse", "animate-rise-sm"],
    ["animate-fade", "animate-draw"],
    ["duration-300", "duration-hover"],
    ["duration-press", "duration-surface"],
    ["data-[ending-style]:duration-surface", "data-[ending-style]:duration-hover"],
    ["scroll-mt-4", "scroll-mt-header"],
    ["proportional-nums", "tabular"],
  ])("resolves the custom tokens %s and %s", (first, second) => {
    expect(cn(first, second)).toBe(second);
  });

  test("keeps variants apart", () => {
    expect(cn("text-heading-md", "md:text-heading-lg")).toBe("text-heading-md md:text-heading-lg");
  });
});
