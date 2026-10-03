import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { SpotlightCard } from "./spotlight-card";

const content = (
  <>
    <h3 className="text-heading-md">Explore an idea</h3>
    <p className="mt-3 text-body text-fg-muted">
      Move a mouse or pen over this surface to follow its soft light. Touch keeps the card still.
    </p>
  </>
);
const meta = {
  title: "Content/SpotlightCard",
  component: SpotlightCard,
  parameters: {
    kit: {
      exports: ["SpotlightCard"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { children: content },
  render: (args) => <SpotlightCard {...args} data-testid="spotlight" />,
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpotlightCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Raised: Story = {
  play: async ({ canvas }) => {
    const card = canvas.getByTestId("spotlight");
    const box = card.getBoundingClientRect();
    await userEvent.pointer({
      target: card,
      coords: { clientX: box.left + 40, clientY: box.top + 40 },
    });
    await waitFor(() => expect(card.style.getPropertyValue("--spot-opacity")).toBe("1"));
    await userEvent.unhover(card);
    await expect(card.style.getPropertyValue("--spot-opacity")).toBe("0");
  },
};
export const Outline: Story = { args: { variant: "outline" } };
export const Glass: Story = { args: { variant: "glass" }, globals: { tone: "ink" } };
export const Plain: Story = { args: { variant: "plain", padding: "none" } };
export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <>
        <h3 className="text-heading-md">Research tools</h3>
        <p className="mt-3 text-body text-fg-muted">
          A card may contain a real link for navigation.
        </p>
        <a
          href="/research"
          className="mt-6 inline-block text-highlight underline transition-colors hover:text-fg"
        >
          Explore research
        </a>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Explore research" })).toHaveFocus();
  },
};
export const LongContent: Story = {
  args: {
    padding: "lg",
    children: (
      <>
        <h3 className="text-heading-md">A collaborative research direction with a longer name</h3>
        <p className="mt-3 text-body text-fg-muted">
          The card grows with its content. Use enough space for several sentences, keep the heading
          and supporting copy on the same grid, and allow a narrow screen to wrap naturally.
        </p>
      </>
    ),
  },
  globals: { viewport: { value: "narrow", isRotated: false } },
};
