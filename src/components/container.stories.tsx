import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Container } from "./container";
import { Heading, Text } from "./typography";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["Container"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  render: (args) => (
    <div className="py-10">
      <Container {...args} className="p-6 border-x border-hairline bg-raised">
        <Heading as="h2">A calm, readable measure</Heading>
        <Text className="mt-3">
          The content column shares responsive gutters with the full site grid. Its maximum width
          changes without moving the band edge.
        </Text>
      </Container>
    </div>
  ),
} satisfies Meta<typeof Container>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { size: "default" } };
export const Wide: Story = { args: { size: "wide" } };
export const Narrow: Story = { args: { size: "narrow" } };
export const ProseMeasure: Story = { args: { size: "prose" } };
export const SemanticArticle: Story = {
  render: () => (
    <Container as="article" aria-labelledby="container-article" size="narrow" className="py-10">
      <Heading as="h2" id="container-article">
        An article within the site grid
      </Heading>
      <Text className="mt-4">The root can use the semantic element required by the document.</Text>
    </Container>
  ),
};
export const LongContent: Story = {
  args: { size: "prose" },
  render: (args) => (
    <Container {...args} className="space-y-5 py-10">
      <Heading as="h2">A measure for complete explanations</Heading>
      <Text>
        Good documentation gives a reader enough context to make the next decision. It connects the
        original question with the evidence, explains where assumptions enter the result, and
        describes what can be tried next.
      </Text>
      <Text>
        A consistent reading width makes that explanation easier to follow across desktop and phone
        screens. The content stays inside the same responsive gutters used by adjacent page
        sections.
      </Text>
    </Container>
  ),
};
