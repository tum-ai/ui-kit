import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Container } from "./container";
import { type KeyDateItem, KeyDates } from "./key-dates";
import { Section } from "./section";

const items: KeyDateItem[] = [
  {
    id: "opening",
    label: "Example opening",
    date: "01 Mar",
    dateTime: "2030-03-01",
    state: "past",
  },
  {
    id: "deadline",
    label: "Example deadline",
    detail: "18:00, example local time",
    date: "16 Mar",
    dateTime: "2030-03-16T18:00:00",
    state: "next",
    note: "Next milestone",
  },
  {
    id: "review",
    label: "Example review",
    date: "22 Mar",
    dateTime: "2030-03-22",
    state: "upcoming",
  },
];
const meta = {
  title: "Compositions/KeyDates",
  component: KeyDates,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["KeyDates"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { items },
  render: (args) => (
    <Section spacing="md">
      <Container size="narrow">
        <p className="mb-6 text-small text-fg-muted">
          An illustrative timeline with caller-supplied states.
        </p>
        <KeyDates {...args} />
      </Container>
    </Section>
  ),
} satisfies Meta<typeof KeyDates>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("term")).toHaveLength(3);
    await expect(canvas.getByText("(passed)")).toHaveClass("sr-only");
    await expect(canvas.getByText("Next milestone")).toBeVisible();
  },
};
export const Large: Story = { args: { size: "lg" } };
export const DrawIn: Story = { args: { drawIn: true } };
export const AllUpcoming: Story = {
  args: { items: items.map((item) => ({ ...item, state: "upcoming", note: undefined })) },
};
export const LongLabels: Story = {
  args: {
    items: [
      {
        id: "long",
        label: "A longer milestone label explaining the task the reader should complete",
        detail:
          "This line gives additional context about the example deadline and can wrap on a phone.",
        date: "16 Mar",
        state: "next",
        note: "Your next step",
      },
      { id: "second", label: "A second milestone with a longer descriptive label", date: "22 Mar" },
    ],
  },
};
