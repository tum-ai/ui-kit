import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Anchor } from "./anchor";

const meta = {
  title: "Actions/Anchor",
  component: Anchor,
  // Anchor is unstyled by design (callers bring the styling), so the hover audit skips it.
  decorators: [
    (Story) => (
      <div data-static-hover>
        <Story />
      </div>
    ),
  ],
  parameters: {
    kit: { exports: ["Anchor"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { href: "/projects", children: "Explore projects" },
} satisfies Meta<typeof Anchor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InternalRoute: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Explore projects" });
    await expect(link).toHaveAttribute("href", "/projects");
    await expect(link).not.toHaveAttribute("target");
  },
};
export const External: Story = {
  args: { href: "https://example.com", children: "Visit the project website" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", {
      name: "Visit the project website (opens in a new tab)",
    });
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAttribute("target", "_blank");
  },
};
export const ExternalSameTab: Story = {
  args: { href: "https://example.com", external: false, children: "Continue in this tab" },
};
export const ForcedNewTab: Story = {
  args: { href: "/documents/report.pdf", external: true, children: "Read the report" },
};
export const ContactAndFragments: Story = {
  render: () => (
    <div className="gap-4 flex flex-col">
      <Anchor href="mailto:hello@example.com">Email the team</Anchor>
      <Anchor href="tel:+4900000000">Call the team</Anchor>
      <Anchor href="#story-target">Go to the answer</Anchor>
      <p id="story-target">The answer is on this page.</p>
    </div>
  ),
};
export const LongLabel: Story = {
  args: {
    children:
      "Read the complete introduction to collaborative research, open projects, and community learning",
    className: "inline-block max-w-sm",
  },
};
