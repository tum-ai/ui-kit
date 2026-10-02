import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { QuoteCard, QuoteMark } from "./quote-card";

const meta = {
  title: "Content/QuoteCard",
  component: QuoteCard,
  parameters: {
    kit: {
      exports: ["QuoteCard", "QuoteMark"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    quote: "The best ideas grow when we build and learn together.",
    name: "Alex Example",
    byline: "Research collaborator",
    portrait: { src: "/assets/placeholder.svg" },
    logo: { src: "/assets/tum_ai_logo_new.svg", alt: "TUM.ai" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuoteCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Raised: Story = {};
export const Glass: Story = { args: { variant: "glass" }, globals: { tone: "ink" } };
export const Editorial: Story = { args: { variant: "editorial" } };
export const Ruled: Story = { args: { variant: "ruled" } };
export const ContextAndFooter: Story = {
  args: {
    context: <span className="text-meta text-fg-muted">Collaboration</span>,
    footer: (
      <p className="mt-5 text-small text-fg-muted">A local example of a testimonial footer.</p>
    ),
  },
};
export const LongContent: Story = {
  args: {
    quote:
      "Working across disciplines gives us the time and space to challenge assumptions, build practical experiments and learn from one another. A longer quotation should remain readable and leave the attribution clearly connected to the text.",
    name: "Alexandria Example Collaborator",
    byline: "Interdisciplinary research and collaborative experimentation team",
  },
  globals: { viewport: { value: "phone", isRotated: false } },
};
export const WithoutImages: Story = { args: { portrait: undefined, logo: undefined } };
export const Mark: Story = {
  render: () => (
    <div>
      <QuoteMark />
      <p className="mt-4 text-body text-fg-muted">
        A decorative opening mark accompanies a semantic blockquote.
      </p>
    </div>
  ),
};
