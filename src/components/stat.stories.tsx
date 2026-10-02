import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Container } from "./container";
import { Section } from "./section";
import { StatGrid } from "./stat";

const items = [
  { value: "12", label: "Example teams", description: "Synthetic figures for layout review" },
  { value: 24, label: "Example projects" },
  { value: "1.2M+", label: "Example reach", count: true },
  { value: "24/7", label: "A static copy figure" },
];
const meta = {
  title: "Compositions/StatGrid",
  component: StatGrid,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["StatGrid"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { items },
  render: (args) => (
    <Section spacing="md">
      <Container>
        <StatGrid {...args} />
      </Container>
    </Section>
  ),
} satisfies Meta<typeof StatGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FourColumns: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("term")).toHaveLength(4);
    await expect(canvas.getByText("24/7")).toBeVisible();
  },
};
export const TwoColumns: Story = { args: { columns: 2 } };
export const ThreeColumns: Story = { args: { columns: 3, items: items.slice(0, 3) } };
export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };
export const ExtraLarge: Story = { args: { size: "xl" } };
export const FormattedNumbers: Story = {
  args: {
    columns: 3,
    items: [
      { value: 2100, prefix: "~", suffix: "+", label: "Grouped whole number" },
      { value: 2.3, decimals: 1, suffix: "%", label: "Decimal percentage" },
      { value: 2000, grouping: false, label: "Ungrouped number" },
    ],
  },
};
export const LongLabels: Story = {
  args: {
    columns: 2,
    items: [
      {
        value: "48",
        label: "A longer explanation of the people represented by this figure",
        description:
          "Extra context can wrap across several lines without changing the relationship between the term and the figure.",
      },
      {
        value: "1,250+",
        label: "A second example with a longer label and a larger figure",
        count: true,
      },
    ],
  },
};
