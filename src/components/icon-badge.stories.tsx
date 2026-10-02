import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Brain, Code, Users } from "lucide-react";

import { IconBadge } from "./icon-badge";

const meta = {
  title: "Content/IconBadge",
  component: IconBadge,
  parameters: {
    kit: { exports: ["IconBadge"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { icon: Brain },
} satisfies Meta<typeof IconBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tint: Story = {};
export const Soft: Story = { args: { variant: "soft", icon: Users } };
export const Outline: Story = { args: { variant: "outline", icon: Code } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const Circle: Story = { args: { shape: "circle" } };
export const Interactive: Story = {
  args: { interactive: true },
  render: (args) => (
    <a
      href="#project"
      className="group/card max-w-md gap-4 rounded-3xl p-6 flex items-center bg-raised text-fg"
    >
      <IconBadge {...args} />
      <span className="flex-1">Explore the research project</span>
      <ArrowRight aria-hidden className="size-5" />
    </a>
  ),
};
export const LongAdjacentText: Story = {
  render: (args) => (
    <div className="max-w-sm gap-4 flex items-start">
      <IconBadge {...args} />
      <p className="text-body text-fg">
        The icon is decorative. The adjacent text explains the full topic: collaborate on research,
        learn from the team, and make the result understandable.
      </p>
    </div>
  ),
};
