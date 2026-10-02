import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Container } from "./container";
import { DayRuler } from "./day-ruler";
import { Section } from "./section";

const meta = {
  title: "Compositions/DayRuler",
  component: DayRuler,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["DayRuler"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: {
    days: 28,
    elapsed: 8,
    startLabel: "Window opens",
    endLabel: "Window closes",
    markLabel: "20 days remain",
  },
  render: (args) => (
    <Section spacing="md">
      <Container size="narrow">
        <p className="mb-8 text-lead text-fg">
          {Math.max(args.days - Math.min(Math.max(args.elapsed, 0), args.days), 0)} days remain in
          this example window.
        </p>
        <DayRuler {...args} />
      </Container>
    </Section>
  ),
} satisfies Meta<typeof DayRuler>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("20 days remain in this example window.")).toBeVisible();
    await expect(canvas.getByText("20 days remain").closest('[aria-hidden="true"]')).not.toBeNull();
  },
};
export const Large: Story = { args: { size: "lg" } };
export const DrawIn: Story = { args: { size: "lg", drawIn: true } };
export const StartOfWindow: Story = { args: { elapsed: 0, markLabel: "The window opens here" } };
export const EndOfWindow: Story = { args: { elapsed: 28, markLabel: "The window closes here" } };
export const ClampedBeforeStart: Story = { args: { elapsed: -3, markLabel: "Before the window" } };
export const ClampedAfterEnd: Story = { args: { elapsed: 40, markLabel: "After the window" } };
