import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Actions } from "./actions";

describe("Actions", () => {
  test("groups its actions in order and forwards group semantics", async () => {
    const { container } = render(
      <Actions role="group" aria-label="Next steps">
        <a href="/join">Join</a>
        <a href="/partners">Partner with us</a>
      </Actions>,
    );
    const group = screen.getByRole("group", { name: "Next steps" });
    expect(Array.from(group.querySelectorAll(":scope > a"), (link) => link.textContent)).toEqual([
      "Join",
      "Partner with us",
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("starts at the leading edge unless centered", () => {
    const { rerender } = render(
      <Actions data-testid="row">
        <a href="/join">Join</a>
      </Actions>,
    );
    const row = screen.getByTestId("row");
    expect(row).toHaveClass("flex-wrap", "w-fit");
    expect(row).not.toHaveClass("justify-center");

    rerender(
      <Actions data-testid="row" align="center">
        <a href="/join">Join</a>
      </Actions>,
    );
    expect(screen.getByTestId("row")).toHaveClass("mx-auto", "justify-center");
  });

  test("merges caller classes over the defaults", () => {
    render(
      <Actions data-testid="row" className="mt-10">
        <a href="/join">Join</a>
      </Actions>,
    );
    expect(screen.getByTestId("row")).toHaveClass("mt-10", "flex");
  });
});
