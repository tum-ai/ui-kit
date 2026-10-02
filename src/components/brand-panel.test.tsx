import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { BrandPanel } from "./brand-panel";

describe("BrandPanel", () => {
  test("is decorative, remains ink, and forwards the root ref", () => {
    let node: HTMLDivElement | null = null;
    const { container } = render(
      <BrandPanel
        ref={(value) => {
          node = value;
        }}
        className="custom"
      >
        Artwork
      </BrandPanel>,
    );
    expect(node).toBe(container.firstElementChild);
    expect(node).toHaveAttribute("aria-hidden", "true");
    expect(node).toHaveAttribute("data-tone", "ink");
    expect(node).toHaveClass("custom");
    expect(container.querySelector("svg")).not.toHaveClass("motion-safe:animate-drift");
  });
  test("wraps negative and large seeds to the same three compositions", () => {
    const { container, rerender } = render(<BrandPanel seed={-1} />);
    const negative = container.innerHTML;
    rerender(<BrandPanel seed={2} />);
    expect(container.innerHTML).toBe(negative);
    rerender(<BrandPanel seed={5} />);
    expect(container.innerHTML).toBe(negative);
  });
});
