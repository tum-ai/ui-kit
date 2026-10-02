import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { SplitWords } from "./split-words";
import { Highlight } from "./typography";

const meta = {
  title: "Motion/SplitWords",
  component: SplitWords,
  parameters: {
    kit: {
      exports: ["SplitWords"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { children: "Build a better question together" },
  render: (args) => (
    <h1 className="max-w-5xl text-display-lg text-fg">
      <SplitWords {...args} />
    </h1>
  ),
} satisfies Meta<typeof SplitWords>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("heading", {
        level: 1,
        name: "Build a better question together",
      }),
    ).toBeVisible();
  },
};
export const MarkedPhrase: Story = {
  args: {
    children: (
      <>
        Build a <Highlight>better question</Highlight> together
      </>
    ),
  },
};
export const CustomTiming: Story = { args: { delay: 160, step: 100 } };
export const RepeatedWords: Story = { args: { children: "Build. Learn. Build again." } };
export const LongHeadline: Story = {
  args: { children: "Different perspectives turn a good question into a shared possibility" },
};
