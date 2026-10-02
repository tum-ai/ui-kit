import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Aurora } from "./aurora";

describe("Aurora", () => {
  test.each([
    ["subtle", "opacity-50"],
    ["default", "opacity-80"],
    ["vivid", "opacity-100"],
  ] as const)("%s keeps light decorative and motion optional", (intensity, opacity) => {
    const { container } = render(<Aurora intensity={intensity} className="custom" />);
    const field = container.firstElementChild;
    expect(field).toHaveAttribute("aria-hidden", "true");
    expect(field).toHaveClass(opacity, "custom", "pointer-events-none");
    expect(field?.children).toHaveLength(3);
    for (const glow of field?.children ?? [])
      expect(glow).toHaveClass("motion-safe:animate-aurora");
  });
});
