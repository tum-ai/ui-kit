import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { SkipLink } from "./skip-link";

const meta = {
  title: "Shell/SkipLink",
  component: SkipLink,
  parameters: { layout: "fullscreen", kit: { exports: ["SkipLink"], tones: ["ink", "night"] } },
  globals: { tone: "ink" },
  args: { targetId: "main-content", label: "Skip to content" },
  render: (args) => (
    <div data-tone="ink" className="p-8 min-h-screen bg-canvas text-fg">
      <SkipLink {...args} />
      <header className="pt-16">
        <nav aria-label="Example navigation">
          <a href="#details" className="text-highlight">
            Navigation before the content
          </a>
        </nav>
      </header>
      <main id={args.targetId} tabIndex={-1} className="mt-16">
        <h1 className="text-display-md">Keyboard users arrive here.</h1>
        <p id="details" className="mt-6 text-body">
          Place the skip link before all other focusable page content.
        </p>
      </main>
    </div>
  ),
} satisfies Meta<typeof SkipLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Skip to content" });
    // Reset between story plays so the first Tab follows the page's natural order.
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await waitFor(() => expect(link.getBoundingClientRect().top).toBeGreaterThanOrEqual(0));
    await expect(link).toHaveAttribute("href", "#main-content");
    await expect(canvas.getByRole("main")).toHaveAttribute("id", "main-content");
  },
};
export const CustomTarget: Story = {
  args: { targetId: "article", label: "Jump to the article" },
  globals: { tone: "night" },
};
