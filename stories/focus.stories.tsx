import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../src/components/button";
const tones = ["paper", "mist", "lavender", "ink", "night", "violet"] as const;
function FocusSpecimen() {
  return (
    <main>
      <h1 className="mb-8 text-heading-lg">Focus follows the nearest tone</h1>
      <div data-tone="ink" className="p-6 gap-6 sm:grid-cols-2 grid">
        {tones.map((tone) => (
          <section key={tone} data-tone={tone} className="p-6 rounded-4xl">
            <h2 className="mb-6 text-heading-md">{tone}</h2>
            <Button variant="outline" data-testid={`focus-${tone}`}>
              Focus on {tone}
            </Button>
          </section>
        ))}
      </div>
    </main>
  );
}
const meta = {
  title: "Foundations/Focus",
  component: FocusSpecimen,
  parameters: {
    kit: { exports: [], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
} satisfies Meta<typeof FocusSpecimen>;
export default meta;
export const NestedTones: StoryObj<typeof meta> = {};
