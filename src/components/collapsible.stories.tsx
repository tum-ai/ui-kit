import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "./button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible";

const meta = {
  title: "Interactions/Collapsible",
  component: Collapsible,
  parameters: {
    kit: {
      exports: ["Collapsible", "CollapsibleTrigger", "CollapsiblePanel"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  render: (args) => (
    <Collapsible {...args}>
      <CollapsibleTrigger render={<Button variant="outline" />}>Project details</CollapsibleTrigger>
      <CollapsiblePanel>
        <p className="pt-4 text-body text-fg-muted">
          This project combines research, design, and a small working prototype.
        </p>
      </CollapsiblePanel>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Project details" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
export const Expanded: Story = { args: { defaultOpen: true } };
export const Disabled: Story = { args: { disabled: true } };
export const LongContent: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Collapsible {...args}>
      <CollapsibleTrigger render={<Button variant="outline" />}>
        Read the complete project description
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="max-w-prose space-y-4 pt-4 text-body text-fg-muted">
          <p>
            Start with a clear question. The team explores existing work, names the assumptions
            behind a first experiment, and makes a small result that everyone can review.
          </p>
          <p>
            As the project grows, keep its decisions understandable. Document the useful
            discoveries, invite feedback from different perspectives, and explain the next step in
            plain language.
          </p>
          <p>
            The disclosed content uses the surrounding band tokens and remains readable at a narrow
            viewport.
          </p>
        </div>
      </CollapsiblePanel>
    </Collapsible>
  ),
};
