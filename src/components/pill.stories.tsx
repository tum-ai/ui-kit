import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Actions } from "./actions";
import { Button } from "./button";
import { Pill, StatusBadge, Tag } from "./pill";

const meta = {
  title: "Content/PillAndStatus",
  component: Pill,
  parameters: {
    kit: {
      exports: ["Pill", "Tag", "StatusBadge"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { children: "Mission" },
} satisfies Meta<typeof Pill>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PillDefault: Story = {};
export const PillSmall: Story = { args: { size: "sm" } };
export const PillStatement: Story = { args: { size: "lg", children: "Vision" } };
export const Tags: Story = {
  render: () => (
    <div className="gap-2 flex flex-wrap">
      <Tag>Research</Tag>
      <Tag>Open source</Tag>
      <Tag>Community learning</Tag>
    </div>
  ),
};
export const Live: Story = {
  render: () => <StatusBadge status="live">Applications open</StatusBadge>,
};
export const Idle: Story = {
  render: () => <StatusBadge status="idle">Next round upcoming</StatusBadge>,
};
export const Closed: Story = {
  render: () => <StatusBadge status="closed">Applications closed</StatusBadge>,
};
export const SmallAlignedActions: Story = {
  render: () => (
    <Actions>
      <Button size="sm">Apply</Button>
      <StatusBadge size="sm">Applications open</StatusBadge>
    </Actions>
  ),
};
export const LargeAlignedActions: Story = {
  render: () => (
    <Actions>
      <Button size="lg" disabled>
        Applications closed
      </Button>
      <StatusBadge size="lg" status="closed">
        The next round is upcoming
      </StatusBadge>
    </Actions>
  ),
};
export const LongStatus: Story = {
  render: () => (
    <div className="max-w-[17rem]">
      <StatusBadge status="idle">
        The next application round will be announced after the current projects finish
      </StatusBadge>
    </div>
  ),
};
