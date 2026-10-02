import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BrandMark } from "./brand-mark";

const meta = {
  title: "Brand/BrandMark",
  component: BrandMark,
  parameters: {
    kit: { exports: ["BrandMark"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { drift: false, className: "w-full max-w-md text-highlight" },
  decorators: [
    (Story) => (
      <div className="p-8 relative isolate overflow-hidden rounded-4xl">
        <Story />
        <h2 className="mt-6 text-heading-md text-fg">Decorative brand geometry</h2>
        <p className="mt-2 max-w-xl text-body text-fg-muted">
          Use the official logo asset for a logo. This tonal shape belongs behind content.
        </p>
      </div>
    ),
  ],
} satisfies Meta<typeof BrandMark>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tonal: Story = {};
export const Gradient: Story = { args: { variant: "gradient" } };
export const DarkIntensity: Story = {
  globals: { tone: "ink" },
  args: { intensity: "strong", className: "w-full max-w-md" },
};
export const AmbientDrift: Story = {
  globals: { tone: "night" },
  args: { drift: true, intensity: "medium", className: "w-full max-w-md" },
};
