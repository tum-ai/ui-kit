import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BulletList } from "./bullet-list";
import { TextLink } from "./text-link";

const meta = {
  title: "Content/BulletList",
  component: BulletList,
  parameters: {
    kit: {
      exports: ["BulletList"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    "aria-label": "Ways to participate",
    items: ["Explore a research question.", "Build a useful prototype.", "Share what you learned."],
  },
} satisfies Meta<typeof BulletList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const RichContent: Story = {
  args: {
    items: [
      <span key="research">
        <strong>Research:</strong> turn an open question into a clear experiment.
      </span>,
      <span key="build">
        <strong>Build:</strong> collaborate on a working prototype and{" "}
        <TextLink href="#demo">read the demo notes</TextLink>.
      </span>,
    ],
  },
};
export const LongContent: Story = {
  args: {
    items: [
      "Start by making the question explicit, naming the assumptions behind it, and agreeing on how the team will evaluate the first result.",
      "Keep the work understandable for the next person joining the project. Document decisions, share useful resources, and explain where feedback would help.",
    ],
  },
  render: (args) => (
    <div className="max-w-sm">
      <BulletList {...args} />
    </div>
  ),
};
export const Empty: Story = { args: { items: [] } };
