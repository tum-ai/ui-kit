import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Aurora } from "./aurora";

const meta = {
  title: "Brand/Aurora",
  component: Aurora,
  parameters: { kit: { exports: ["Aurora"], tones: ["ink", "night"] } },
  globals: { tone: "ink" },
  decorators: [
    (Story) => (
      <div className="min-h-96 p-10 relative isolate overflow-hidden rounded-4xl">
        <Story />
        <h2 className="relative text-display-md text-fg">A quiet field of light.</h2>
        <p className="mt-5 max-w-lg relative text-body text-fg-muted">
          Decorative light stays still when reduced motion is enabled.
        </p>
      </div>
    ),
  ],
} satisfies Meta<typeof Aurora>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Subtle: Story = { args: { intensity: "subtle" } };
export const Vivid: Story = { args: { intensity: "vivid" } };
