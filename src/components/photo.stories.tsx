import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Photo } from "./photo";

const meta = {
  title: "Media/Photo",
  component: Photo,
  parameters: {
    kit: { exports: ["Photo"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: {
    src: "/assets/placeholder.svg",
    alt: "Abstract shapes representing a collaborative workshop",
    caption: "Illustration used as a local media fixture.",
  },
} satisfies Meta<typeof Photo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const AspectRatios: Story = {
  render: (args) => (
    <div className="gap-8 sm:grid-cols-2 grid">
      {(["3/2", "4/3", "16/10", "4/5", "1/1"] as const).map((aspect) => (
        <Photo key={aspect} {...args} aspect={aspect} caption={aspect} />
      ))}
    </div>
  ),
};
export const Bleed: Story = { args: { shape: "bleed" } };
export const PanoramaResponsive: Story = {
  args: { aspect: "panorama" },
  globals: { viewport: { value: "phone", isRotated: false } },
};
export const EagerAndFocalPoint: Story = { args: { eager: true, position: "50% 30%" } };
export const LongCaption: Story = {
  args: {
    caption:
      "A long factual caption can describe the subject, location and context of a documentary photo. This local fixture lets the caption wrap over several lines while preserving the same rhythm as a shorter caption.",
  },
};
