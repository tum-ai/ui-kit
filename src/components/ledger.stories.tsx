import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Container } from "./container";
import { Ledger } from "./ledger";
import { Section } from "./section";

const meta = {
  title: "Compositions/Ledger",
  component: Ledger,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["Ledger"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: {
    items: [
      { label: "Example projects", value: "24", note: "Synthetic figures for layout review" },
      { label: "Example participants", value: 1250, suffix: "+" },
      { label: "Example reach", value: "1.2M+", count: true },
    ],
  },
  render: (args) => (
    <Section spacing="md">
      <Container size="narrow">
        <Ledger {...args} />
      </Container>
    </Section>
  ),
} satisfies Meta<typeof Ledger>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("term")).toHaveLength(3);
  },
};
export const Large: Story = { args: { size: "lg" } };
export const CopyFigures: Story = {
  args: {
    items: [
      { label: "Static copy", value: "24/7" },
      { label: "Year without grouping", value: "2000" },
      { label: "Decimal figure", value: 2.3, decimals: 1, suffix: "%" },
    ],
  },
};
export const LongLabels: Story = {
  args: {
    items: [
      {
        label: "A longer label that describes the full meaning of a figure",
        value: "1,250+",
        note: "A longer source note can explain how a figure is interpreted and provide context for the reader.",
      },
      { label: "Another longer label for comparison", value: "48" },
    ],
  },
};
