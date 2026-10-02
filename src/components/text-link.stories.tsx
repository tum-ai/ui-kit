import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { TextLink } from "./text-link";

const meta = {
  title: "Actions/TextLink",
  component: TextLink,
  parameters: {
    kit: { exports: ["TextLink"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { href: "/projects", children: "Explore the projects" },
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Accent: Story = {};
export const Muted: Story = { args: { emphasis: "muted" } };
export const WithArrow: Story = { args: { arrow: true } };
export const External: Story = {
  args: { href: "https://example.com", children: "Visit the project website", arrow: true },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", {
      name: "Visit the project website (opens in a new tab)",
    });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  },
};
export const InParagraph: Story = {
  render: (args) => (
    <p className="max-w-xl text-body text-fg-muted">
      Learn how the team approached its research question and{" "}
      <TextLink {...args}>read the project notes</TextLink> before joining the next discussion.
    </p>
  ),
};
export const LongLabel: Story = {
  args: {
    children:
      "Read the complete project introduction, experiment notes, and recommendations for the next team",
    arrow: true,
    className: "max-w-sm",
  },
};
