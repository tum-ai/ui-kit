import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";

import { HalftoneField } from "./halftone-field";
import { Sun } from "./sun";

function Scene({ horizon = false }: { horizon?: boolean }) {
  const sunRef = useRef<HTMLSpanElement>(null);
  const clearRef = useRef<HTMLDivElement>(null);
  return (
    <div className="p-10 relative isolate min-h-[32rem] overflow-hidden rounded-4xl bg-canvas">
      <HalftoneField
        cell={15}
        pointer={!horizon}
        rise={!horizon}
        sunRef={sunRef}
        clearRef={horizon ? undefined : clearRef}
        initial={horizon ? { alpha: 0.9, fadeTop: [0.55, 0.85] } : { alpha: 0.95 }}
        className="-z-10"
      />
      <div ref={clearRef} className="max-w-lg relative">
        <h2 className="text-display-md text-fg">Two sunrises, one prototype.</h2>
        <p className="mt-5 text-body text-fg-muted">
          The field draws only while on screen and holds still under reduced motion.
        </p>
      </div>
      {horizon ? (
        <Sun ref={sunRef} className="bottom-0 w-40 left-1/2 -translate-x-1/2 translate-y-3/4" />
      ) : (
        <Sun ref={sunRef} className="right-16 top-16 w-28" />
      )}
    </div>
  );
}

const meta = {
  title: "Brand/Halftone",
  component: Scene,
  parameters: { kit: { exports: ["HalftoneField", "Sun"], tones: ["night", "ink"] } },
  globals: { tone: "night" },
} satisfies Meta<typeof Scene>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Bloom: Story = {};
export const Horizon: Story = { args: { horizon: true } };
