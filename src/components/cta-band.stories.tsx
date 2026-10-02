import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight } from "lucide-react";
import { expect, within } from "storybook/test";

import { ButtonLink } from "./button";
import { CtaBand } from "./cta-band";

const meta = {
  title: "Compositions/CtaBand",
  component: CtaBand,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["CtaBand"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: {
    titleId: "kit-cta-title",
    title: "Start with a conversation",
    lead: "Tell us what you are curious about. A shared question can become the beginning of something useful.",
    actions: (
      <>
        <ButtonLink href="#contact" arrow>
          Start a conversation
        </ButtonLink>
        <ButtonLink href="#examples" variant="outline">
          Explore examples
        </ButtonLink>
      </>
    ),
  },
} satisfies Meta<typeof CtaBand>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Start with a conversation" }),
    ).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Start with a conversation" })).toHaveAttribute(
      "data-tone",
      "paper",
    );
  },
};
export const FullBleed: Story = { args: { variant: "band" } };
export const LavenderPanel: Story = { args: { tone: "lavender", eyebrow: "Next steps" } };
export const Artwork: Story = {
  args: {
    mark: false,
    visual: <ArrowUpRight aria-hidden="true" className="size-16 mx-auto text-highlight" />,
  },
};
export const WithFooter: Story = {
  args: {
    children: (
      <p className="text-small text-fg-muted">A short context line can sit below the actions.</p>
    ),
    classNames: { footer: "mt-8" },
  },
};
export const LongContent: Story = {
  args: {
    title: "Bring the question that you have not found the right people to explore yet",
    lead: "The closing statement can hold a longer thought. Keep the actions clear and let the generous spacing give the reader time to decide where to go next.",
    variant: "band",
    mark: false,
  },
};
