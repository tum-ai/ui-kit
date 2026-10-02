import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { MotionProvider } from "./motion-provider";
import { Reveal } from "./reveal";

const meta = {
  title: "Motion/Reveal",
  component: Reveal,
  parameters: {
    kit: {
      exports: ["Reveal", "MotionProvider"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    children: (
      <>
        <h2 className="text-heading-lg text-fg">Visible from the beginning</h2>
        <p className="mt-4 max-w-xl text-body text-fg-muted">
          Content that starts in view stays visible. Scroll entrances enhance content after
          hydration.
        </p>
      </>
    ),
  },
  render: (args) => (
    <MotionProvider>
      <Reveal {...args} />
    </MotionProvider>
  ),
} satisfies Meta<typeof Reveal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Up: Story = {
  args: { variant: "up" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("heading", { name: "Visible from the beginning" }),
    ).toBeVisible();
  },
};
export const Fade: Story = { args: { variant: "fade" } };
export const Scale: Story = { args: { variant: "scale" } };
export const Left: Story = { args: { variant: "left" } };
export const Right: Story = { args: { variant: "right" } };
export const Line: Story = {
  args: {
    variant: "line",
    children: <div className="h-px w-full bg-hairline-strong" aria-hidden="true" />,
  },
};
export const StaggeredOnScroll: Story = {
  render: () => (
    <MotionProvider>
      <p className="text-small text-fg-muted">Scroll to reveal a sequence of content blocks.</p>
      <div style={{ height: "110vh" }} aria-hidden="true" />
      <div className="space-y-8 pb-16">
        {["up", "fade", "scale", "left", "right", "line"].map((variant, index) => (
          <Reveal
            key={variant}
            variant={variant as "up" | "fade" | "scale" | "left" | "right" | "line"}
            delay={index * 80}
          >
            <h2 className="text-heading-md text-fg">
              {variant === "line"
                ? "The line variant can also draw content"
                : `A ${variant} entrance`}
            </h2>
            <p className="mt-2 text-body text-fg-muted">
              The same content remains available without JavaScript or when motion is reduced.
            </p>
          </Reveal>
        ))}
      </div>
    </MotionProvider>
  ),
};
