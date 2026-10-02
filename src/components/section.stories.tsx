import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Container } from "./container";
import { Section } from "./section";
import { Display, Text } from "./typography";

const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["Section"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { tone: "paper", spacing: "md", "aria-labelledby": "section-heading" },
  render: (args) => (
    <Section {...args}>
      <Container>
        <Display id="section-heading" size="md">
          Ideas become useful together.
        </Display>
        {args.tone !== "violet" ? (
          <Text size="lead" className="mt-6 max-w-2xl">
            A full-width band sets the semantic colors for every component inside it. Its content
            aligns with the shared responsive grid.
          </Text>
        ) : null}
      </Container>
    </Section>
  ),
} satisfies Meta<typeof Section>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Paper: Story = {};
export const Mist: Story = { args: { tone: "mist" } };
export const Lavender: Story = { args: { tone: "lavender" } };
export const Ink: Story = { args: { tone: "ink" } };
export const Night: Story = { args: { tone: "night" } };
export const VioletStatement: Story = { args: { tone: "violet" } };
export const Grain: Story = { args: { tone: "night", grain: true } };
export const SmallSpacing: Story = { args: { spacing: "sm" } };
export const LargeSpacing: Story = { args: { spacing: "lg" } };
export const ExtraLargeSpacing: Story = { args: { spacing: "xl" } };
export const NoSpacing: Story = { args: { spacing: "none", className: "py-8" } };
export const LongContent: Story = {
  args: { tone: "lavender" },
  render: (args) => (
    <Section {...args}>
      <Container size="prose">
        <Display id="section-heading" size="md">
          A complete explanation in a calm reading band
        </Display>
        <Text className="mt-6">
          Each section has a clear place in the page. Give it a name through its heading, use one
          band tone for the whole section, and let the components read the semantic color tokens.
        </Text>
        <Text className="mt-4">
          The same content remains aligned and readable on a narrow phone. Longer paragraphs wrap
          naturally without introducing a different visual language.
        </Text>
      </Container>
    </Section>
  ),
};
