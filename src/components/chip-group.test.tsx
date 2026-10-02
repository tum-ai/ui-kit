import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";

import { ChipGroup } from "./chip-group";

const options = [
  { value: "all", label: "All", count: 9 },
  { value: "hackathon", label: "Hackathon", count: 1 },
  { value: "speaker", label: "Speaker" },
];

function Controlled({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("all");
  return (
    <ChipGroup
      label="Category"
      options={options}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("ChipGroup", () => {
  test("is a named group of toggle buttons with the value pressed", () => {
    render(<Controlled />);
    expect(screen.getByRole("group", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Hackathon/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("shows counts in the chip label", () => {
    render(<Controlled />);
    expect(screen.getByRole("button", { name: /^All\s?9$/ })).toBeInTheDocument();
  });

  test("selects a chip on click and reports it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Controlled onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Speaker/ }));
    expect(onChange).toHaveBeenCalledWith("speaker");
    expect(screen.getByRole("button", { name: /Speaker/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("cannot be cleared to nothing by pressing the selected chip", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Controlled onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /All/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("moves focus between chips with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Hackathon/ })).toHaveFocus();
  });

  test("prefers a visible label element over the fallback name", () => {
    render(
      <>
        <p id="filter-label">Filter by type</p>
        <ChipGroup
          label="Category"
          labelledBy="filter-label"
          options={options}
          value="all"
          onValueChange={() => {}}
        />
      </>,
    );
    expect(screen.getByRole("group", { name: "Filter by type" })).toBeInTheDocument();
  });

  test("has no axe violations", async () => {
    const { container } = render(<Controlled />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
