import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Aurora } from "./aurora";
import { TopBlend } from "./top-blend";

const meta = {
  title: "Brand/TopBlend",
  component: TopBlend,
  parameters: { kit: { exports: ["TopBlend"], tones: ["night", "ink"] } },
  globals: { tone: "night" },
  decorators: [
    (Story) => (
      <div className="min-h-96 p-10 relative isolate overflow-hidden rounded-4xl">
        <Aurora intensity="vivid" />
        <Story />
        <h2 className="relative text-display-md text-fg">An eased band edge.</h2>
        <p className="mt-5 max-w-xl relative text-body text-fg-muted">
          The decorative gradient blends artwork into the brand canvas above or below a band.
        </p>
      </div>
    ),
  ],
} satisfies Meta<typeof TopBlend>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Top: Story = {};
export const Bottom: Story = { args: { edge: "bottom" } };
