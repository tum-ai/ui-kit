import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Actions } from "./actions";
import { Button, ButtonLink } from "./button";
import { StatusBadge } from "./pill";

const meta = {
  title: "Actions/Actions",
  component: Actions,
  parameters: {
    kit: { exports: ["Actions"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  render: (args) => (
    <Actions {...args}>
      <ButtonLink href="#learn" arrow>
        Explore the programme
      </ButtonLink>
      <ButtonLink href="#contact" variant="outline">
        Contact the team
      </ButtonLink>
    </Actions>
  ),
} satisfies Meta<typeof Actions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Start: Story = { args: { align: "start" } };
export const Center: Story = { args: { align: "center" } };
export const WithStatus: Story = {
  render: (args) => (
    <Actions {...args}>
      <Button size="lg">Get involved</Button>
      <StatusBadge size="lg" status="live">
        Applications open
      </StatusBadge>
    </Actions>
  ),
};
export const WrappedLongContent: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <Actions {...args}>
        <ButtonLink href="#research">Explore research projects</ButtonLink>
        <ButtonLink href="#community" variant="outline">
          Meet our wider community
        </ButtonLink>
        <StatusBadge status="idle">The next round will be announced soon</StatusBadge>
      </Actions>
    </div>
  ),
};
export const DisabledAction: Story = {
  render: (args) => (
    <Actions {...args}>
      <Button disabled>Registration unavailable</Button>
      <ButtonLink href="#details" variant="outline">
        Read the details
      </ButtonLink>
    </Actions>
  ),
};
