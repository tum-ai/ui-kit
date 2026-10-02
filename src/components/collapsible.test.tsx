import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible";

function Example({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>Filters</CollapsibleTrigger>
      <CollapsiblePanel>
        <p>Filter options</p>
      </CollapsiblePanel>
    </Collapsible>
  );
}

describe("Collapsible", () => {
  test("starts closed with the panel hidden", () => {
    render(<Example />);
    expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Filter options")).not.toBeInTheDocument();
  });

  test("opens and closes from the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Filters" });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByText("Filter options");
    expect(panel).toBeVisible();
    expect(trigger).toHaveAttribute("aria-controls", panel.parentElement?.id ?? "");

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("marks the trigger as the group for open-state styling", () => {
    render(<Example defaultOpen />);
    const trigger = screen.getByRole("button", { name: "Filters" });
    expect(trigger).toHaveClass("group/collapsible");
    expect(trigger).toHaveAttribute("data-panel-open");
  });

  test("has no axe violations when open", async () => {
    const { container } = render(<Example defaultOpen />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
