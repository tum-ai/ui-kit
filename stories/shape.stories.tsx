import type { Meta, StoryObj } from "@storybook/nextjs-vite";
function ShapeSpecimen() {
  return (
    <main className="max-w-5xl mx-auto">
      <h1 className="text-display-md">Space, shape and depth</h1>
      <p className="mt-6 text-body text-fg-muted">
        Use the spacing rhythm to group related content. Shadows describe raised surfaces, not
        decoration.
      </p>
      <section className="mt-12">
        <h2 className="text-heading-lg">Spacing</h2>
        <div className="mt-6 gap-4 grid">
          {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
            <div key={size} className="gap-4 flex items-center">
              <span className="w-16 text-meta">{size}px</span>
              <div
                aria-hidden
                style={{ width: size, height: 12, background: "var(--tone-accent)" }}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-heading-lg">Shape</h2>
        <div className="mt-6 gap-6 flex flex-wrap">
          {["sm", "md", "lg", "xl", "4xl", "5xl"].map((radius) => (
            <div
              key={radius}
              className="size-24 grid place-items-center bg-sunken text-meta"
              style={{ borderRadius: `var(--radius-${radius})` }}
            >
              {radius}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-heading-lg">Depth</h2>
        <div className="mt-6 gap-8 sm:grid-cols-2 grid">
          <div className="p-8 rounded-4xl bg-raised shadow-soft">Soft elevation</div>
          <div className="p-8 rounded-4xl bg-raised shadow-lift">Lifted elevation</div>
        </div>
      </section>
    </main>
  );
}
const meta = {
  title: "Foundations/Spacing and shape",
  component: ShapeSpecimen,
  parameters: { kit: { exports: [], tones: ["paper", "mist", "lavender", "ink", "night"] } },
} satisfies Meta<typeof ShapeSpecimen>;
export default meta;
export const Scale: StoryObj<typeof meta> = {};
