import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BrandPanel } from "./brand-panel";

const meta = {
  title: "Brand/BrandPanel",
  component: BrandPanel,
  parameters: { kit: { exports: ["BrandPanel"], tones: ["ink"] } },
  decorators: [
    (Story) => (
      <figure className="max-w-3xl">
        <div className="group/zoom relative aspect-[3/2] overflow-hidden rounded-4xl">
          <Story />
        </div>
        <figcaption className="mt-4 text-meta text-fg-muted">
          A branded stand-in when documentary photography is unavailable.
        </figcaption>
      </figure>
    ),
  ],
} satisfies Meta<typeof BrandPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FirstComposition: Story = { args: { seed: 0 } };
export const SecondComposition: Story = { args: { seed: 1 } };
export const ThirdComposition: Story = { args: { seed: 2 } };
