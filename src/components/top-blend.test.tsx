import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TopBlend } from "./top-blend";

describe("TopBlend", () => {
  test("is hidden decorative geometry with a top default and bottom option", () => {
    const { container, rerender } = render(<TopBlend />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveClass("top-0", "pointer-events-none");
    rerender(<TopBlend edge="bottom" className="custom" />);
    expect(container.firstElementChild).toHaveClass("bottom-0", "custom");
    expect(container.firstElementChild).not.toHaveClass("top-0");
  });
});
