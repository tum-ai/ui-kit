import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { NavAnchor } from "./nav-anchor";

const meta = {
  title: "Shell/NavAnchor",
  component: NavAnchor,
  parameters: { kit: { exports: ["NavAnchor"], tones: ["ink", "night"] } },
  globals: { tone: "ink" },
  args: { href: "/projects", label: "Projects" },
  render: (args) => (
    <nav aria-label="Example navigation">
      <ul className="gap-6 flex flex-wrap items-center text-body">
        <li>
          <NavAnchor {...args} className="font-medium text-fg hover:text-highlight" />
        </li>
        <li>
          <NavAnchor href="#contact" label="Contact" className="text-fg-muted hover:text-fg" />
        </li>
      </ul>
    </nav>
  ),
} satisfies Meta<typeof NavAnchor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Projects" });
    // Reset between story plays so the first Tab follows the page's natural order.
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveAttribute("href", "/projects");
    await expect(link).not.toHaveAttribute("target");
  },
};
export const Current: Story = {
  args: {
    "aria-current": "page",
    children: (
      <span className="gap-2 inline-flex items-center">
        Projects
        <span aria-hidden="true" className="size-1.5 rounded-full bg-highlight" />
      </span>
    ),
  },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Projects" });
    await expect(link).toHaveAttribute("aria-current", "page");
  },
};
export const External: Story = {
  args: { href: "https://example.com", label: "Partner site" },
  globals: { tone: "night" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", {
      name: "Partner site (opens in a new tab)",
    });
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};
