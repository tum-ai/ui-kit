import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StatusBadge } from "./pill";

describe("StatusBadge", () => {
  test.each(["live", "idle", "closed"] as const)(
    "%s: the label carries the state; the dot is decorative",
    async (status) => {
      const { container } = render(
        <StatusBadge status={status}>Applications {status}</StatusBadge>,
      );
      const badge = screen.getByText(`Applications ${status}`).closest("[data-status]");
      expect(badge).toHaveAttribute("data-status", status);
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  test("only the live state pulses", () => {
    const { container, rerender } = render(<StatusBadge status="live">Open</StatusBadge>);
    expect(container.querySelector(".motion-safe\\:animate-pulse-ring")).not.toBeNull();
    rerender(<StatusBadge status="closed">Closed</StatusBadge>);
    expect(container.querySelector(".motion-safe\\:animate-pulse-ring")).toBeNull();
  });
});
