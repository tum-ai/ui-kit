import type { Meta, StoryObj } from "@storybook/nextjs-vite";
const tones = ["paper", "mist", "lavender", "ink", "night", "violet"] as const;
function ToneSpecimen() {
  return (
    <main>
      <div className="max-w-7xl px-6 py-16 mx-auto">
        <p className="text-eyebrow text-highlight">TUM.ai / Foundations</p>
        <h1 className="mt-5 text-display-lg">Six tones, one identity</h1>
        <p className="mt-6 max-w-2xl text-lead text-fg-muted">
          Precise typography. Calm surfaces. Clear interaction. The same semantic tokens adapt to
          every band.
        </p>
      </div>
      <div className="md:grid-cols-2 grid">
        {tones.map((tone) => (
          <section
            key={tone}
            data-tone={tone}
            className="px-6 py-12 md:px-12"
            aria-label={`${tone} tone`}
          >
            <p className="text-eyebrow">{tone}</p>
            <h2 className="mt-6 text-heading-lg">Ideas become things.</h2>
            <p className="mt-4 text-body text-fg-muted">Build with the right foundations.</p>
            <a href="#principles" className="mt-6 inline-block text-body text-highlight underline">
              Explore the principles
            </a>
          </section>
        ))}
      </div>
      <section id="principles" className="max-w-7xl px-6 py-16 mx-auto">
        <h2 className="text-heading-lg">Accessible by construction</h2>
        <p className="mt-4 max-w-2xl text-body">
          Use semantic tokens, maintain the visible focus ring, and verify behavior with keyboard
          and screen readers. The violet tone has a deliberately limited text palette.
        </p>
      </section>
    </main>
  );
}
const meta = {
  title: "Foundations/Tones",
  component: ToneSpecimen,
  parameters: {
    layout: "fullscreen",
    kit: { exports: [], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
} satisfies Meta<typeof ToneSpecimen>;
export default meta;
export const AllTones: StoryObj<typeof meta> = {};
