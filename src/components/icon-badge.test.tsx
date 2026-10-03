import { axe } from "@test/axe";
import { render } from "@testing-library/react";
import { Sparkles } from "lucide-react";
import { describe, expect, test } from "vitest";

import { IconBadge } from "./icon-badge";

describe("IconBadge", () => {
  test("hides the icon from assistive tech and adds no name of its own", async () => {
    const { container } = render(
      <div>
        <IconBadge icon={Sparkles} />
        <h3>Innovation</h3>
      </div>,
    );
    const badge = container.querySelector("span");
    const icon = badge?.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("stroke-width", "1.75");
    expect(badge).toHaveTextContent(/^$/);
    expect(badge).not.toHaveAttribute("role");
    expect(await axe(container)).toHaveNoViolations();
  });

  test("is a static tinted square by default", () => {
    const { container } = render(<IconBadge icon={Sparkles} />);
    const badge = container.firstElementChild;
    expect(badge).toHaveClass("size-12", "rounded-2xl", "bg-violet-500/12");
    expect(badge?.className).not.toMatch(/card-hover:/);
  });

  test("interactive adds the card-hover fill and a motion-gated tilt", () => {
    const { container } = render(<IconBadge icon={Sparkles} interactive />);
    const badge = container.firstElementChild;
    expect(badge).toHaveClass(
      "card-hover:bg-violet-600",
      "motion-safe:card-hover:-rotate-6",
      "motion-reduce:transition-none",
    );
    expect(badge?.className).not.toMatch(/(^|\s)card-hover:-rotate-6/);
  });

  test("circle drops the square corners, and size and stroke follow the props", () => {
    const { container } = render(
      <IconBadge icon={Sparkles} shape="circle" size="sm" variant="outline" strokeWidth={2} />,
    );
    const badge = container.firstElementChild;
    expect(badge).toHaveClass("rounded-full", "size-8", "border-hairline-strong");
    expect(badge).not.toHaveClass("rounded-lg");
    expect(badge?.querySelector("svg")).toHaveAttribute("stroke-width", "2");
  });
});
