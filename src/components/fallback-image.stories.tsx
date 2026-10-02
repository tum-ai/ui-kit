import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";

import { BrandPanel } from "./brand-panel";
import { Button } from "./button";
import { FallbackImage } from "./fallback-image";

const fallback = (
  <div role="img" aria-label="Image unavailable" className="relative aspect-[3/2]">
    <BrandPanel />
  </div>
);
const meta = {
  title: "Media/FallbackImage",
  component: FallbackImage,
  parameters: {
    kit: {
      exports: ["FallbackImage"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    src: "/assets/placeholder.svg",
    alt: "Abstract illustration for a workshop",
    width: 720,
    height: 480,
    fallback,
    className: "h-auto w-full",
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl overflow-hidden rounded-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FallbackImage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Image: Story = {};
export const MissingSource: Story = {
  args: { src: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Image unavailable" })).toBeVisible();
  },
};
export const LoadError: Story = {
  play: async ({ canvas }) => {
    canvas
      .getByRole("img", { name: "Abstract illustration for a workshop" })
      .dispatchEvent(new Event("error"));
    await expect(canvas.findByRole("img", { name: "Image unavailable" })).resolves.toBeVisible();
  },
};
function RetryExample() {
  const [src, setSrc] = useState("/assets/placeholder.svg");
  return (
    <div>
      <FallbackImage
        src={src}
        alt="Example artwork"
        width={720}
        height={480}
        fallback={fallback}
        className="h-auto w-full"
      />
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => setSrc("/assets/tum_ai_logo_new.svg")}
      >
        Load a new source
      </Button>
    </div>
  );
}
export const RetryWithNewSource: Story = {
  render: () => <RetryExample />,
  play: async ({ canvas }) => {
    canvas.getByRole("img", { name: "Example artwork" }).dispatchEvent(new Event("error"));
    await expect(canvas.findByRole("img", { name: "Image unavailable" })).resolves.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Load a new source" }));
    await expect(canvas.findByRole("img", { name: "Example artwork" })).resolves.toBeVisible();
  },
};
