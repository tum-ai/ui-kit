import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Check, Lightbulb, Search } from "lucide-react";
import { expect, within } from "storybook/test";

import { Container } from "./container";
import { Section } from "./section";
import { Steps } from "./steps";

const items = [
  {
    title: "Ask a question",
    detail: "Start with curiosity",
    description: "Describe the problem you want to understand.",
  },
  {
    title: "Explore together",
    detail: "Compare perspectives",
    description: "Make space for different approaches and decide what to try.",
    number: "02A",
  },
  {
    title: "Build a small version",
    detail: "Keep it concrete",
    description: "Create a first version that makes the idea easier to discuss.",
  },
  {
    title: "Share what you learn",
    detail: "Make the next step clear",
    description: "Use feedback to decide where the work should go next.",
  },
];
const meta = {
  title: "Compositions/Steps",
  component: Steps,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["Steps"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { items },
  render: (args) => (
    <Section spacing="lg">
      <Container>
        <Steps {...args} />
      </Container>
    </Section>
  ),
} satisfies Meta<typeof Steps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SolidRail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(4);
    await expect(canvas.getByText("02A")).toBeVisible();
  },
};
export const DashedRail: Story = { args: { rail: "dashed" } };
export const DotMarkers: Story = { args: { marker: "dot", rail: "dashed" } };
export const WithoutRail: Story = { args: { rail: "none" } };
export const Rows: Story = { args: { layout: "rows" } };
export const ThreeColumns: Story = { args: { columns: 3, items: items.slice(0, 3) } };
export const FiveColumns: Story = {
  args: {
    columns: 5,
    items: [
      ...items,
      { title: "Choose the next question", description: "Continue with a clearer point of view." },
    ],
  },
};
export const IconMarkers: Story = {
  args: {
    columns: 3,
    items: items
      .slice(0, 3)
      .map((item, index) => ({ ...item, icon: [Search, Lightbulb, Check][index] })),
  },
};
export const LongContent: Story = {
  args: {
    layout: "rows",
    items: [
      {
        title: "Describe a question whose answer needs several different perspectives",
        description:
          "Give the reader enough detail to understand the intention behind this step. A long description can wrap without losing the number or the alignment of the heading beside it.",
        detail: "A useful first step",
      },
      {
        title: "Make a small, practical experiment that helps everyone discuss the idea",
        description:
          "The next step turns the question into something concrete, with enough structure to compare alternatives and gather useful feedback.",
        number: "02B",
      },
    ],
  },
};
