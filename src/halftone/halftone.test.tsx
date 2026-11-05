import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { stubObservers } from "../components/testing";
import { HalftoneField } from "./halftone-field";
import { effectiveDpr } from "./renderer";
import { Sun } from "./sun";

describe("HalftoneField", () => {
  test("is decorative and falls back to the CSS dots without WebGL", async () => {
    const { container } = render(<HalftoneField className="custom" />);
    const field = container.firstElementChild;
    expect(field).toHaveAttribute("aria-hidden", "true");
    expect(field).toHaveClass("halftone", "custom");
    expect(field).toHaveAttribute("data-halftone", "pending");
    expect(field?.querySelector(".halftone-fallback")).not.toBeNull();
    expect(field?.querySelector("canvas.halftone-canvas")).not.toBeNull();
    // jsdom has no WebGL2, so the renderer declines and the CSS dots show.
    await waitFor(() => expect(field).toHaveAttribute("data-halftone", "css"));
  });

  test("waits to start until the field comes within a viewport", async () => {
    const { intersect } = stubObservers();
    try {
      const { container } = render(<HalftoneField />);
      const field = container.firstElementChild;
      const canvas = field?.querySelector("canvas");
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(field).toHaveAttribute("data-halftone", "pending");
      if (canvas) act(() => intersect(canvas));
      await waitFor(() => expect(field).toHaveAttribute("data-halftone", "css"));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("effectiveDpr", () => {
  test("caps the pixel ratio at 2 and at the pixel budget", () => {
    expect(effectiveDpr(800, 600, 3, false)).toBe(2);
    expect(effectiveDpr(800, 600, 1, false)).toBe(1);
    expect(effectiveDpr(3000, 2000, 2, false)).toBe(1);
    expect(effectiveDpr(1200, 1000, 2, true)).toBeCloseTo(Math.sqrt(2_000_000 / 1_200_000));
  });

  test("a reduced quality level shrinks the budget and may drop below 1", () => {
    expect(effectiveDpr(1200, 1000, 2, true, 0.5)).toBeCloseTo(Math.sqrt(1_000_000 / 1_200_000));
    expect(effectiveDpr(3000, 2000, 2, false, 0.35)).toBe(0.75);
  });
});

describe("Sun", () => {
  test("is decorative and draws the glow unless turned off", () => {
    const { container, rerender } = render(<Sun className="w-10" />);
    const sun = container.firstElementChild;
    expect(sun).toHaveAttribute("aria-hidden", "true");
    expect(sun).toHaveClass("sun", "w-10");
    expect(sun?.querySelector(".sun-glow")).not.toBeNull();
    rerender(<Sun glow={false} />);
    expect(container.querySelector(".sun-glow")).toBeNull();
    expect(container.querySelector(".sun-disc")).not.toBeNull();
  });
});
