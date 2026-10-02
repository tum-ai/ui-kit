import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { ChipGroup, type ChipGroupProps } from "./chip-group";

function Filter(args: ChipGroupProps) {
  const [value, setValue] = useState(args.value);
  return (
    <ChipGroup
      {...args}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        args.onValueChange(next);
      }}
    />
  );
}
const meta = {
  title: "Interactions/ChipGroup",
  component: ChipGroup,
  parameters: {
    kit: { exports: ["ChipGroup"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: {
    label: "Filter projects",
    value: "all",
    onValueChange: fn(),
    options: [
      { value: "all", label: "All", count: 12 },
      { value: "research", label: "Research", count: 4 },
      { value: "products", label: "Products", count: 8 },
    ],
  },
  render: (args) => <Filter {...args} />,
} satisfies Meta<typeof ChipGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllSelected: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const research = canvas.getByRole("button", { name: "Research 4" });
    await userEvent.click(research);
    await expect(research).toHaveAttribute("aria-pressed", "true");
    await expect(args.onValueChange).toHaveBeenCalledWith("research");
    await userEvent.click(research);
    await expect(research).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Products 8" })).toHaveFocus();
  },
};
export const SpecificSelection: Story = { args: { value: "products" } };
export const WithoutCounts: Story = {
  args: {
    options: [
      { value: "all", label: "All" },
      { value: "research", label: "Research" },
      { value: "products", label: "Products" },
    ],
  },
};
export const VisibleLabel: Story = {
  args: { labelledBy: "chip-story-label" },
  render: (args) => (
    <div>
      <p id="chip-story-label" className="mb-3 text-label">
        Choose a project category
      </p>
      <Filter {...args} />
    </div>
  ),
};
export const LongLabels: Story = {
  args: {
    options: [
      { value: "all", label: "All project categories", count: 12 },
      { value: "research", label: "Research and experiments", count: 4 },
      { value: "products", label: "Products and prototypes", count: 8 },
    ],
  },
  render: (args) => (
    <div className="max-w-sm">
      <Filter {...args} />
    </div>
  ),
};
export const ZeroCount: Story = {
  args: {
    options: [
      { value: "all", label: "All", count: 0 },
      { value: "research", label: "Research", count: 0 },
    ],
  },
};
