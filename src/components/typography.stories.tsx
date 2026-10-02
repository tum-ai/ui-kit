import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Display, Eyebrow, Heading, Highlight, Prose, Text } from "./typography";

const meta = {
  title: "Foundations/Typography",
  component: Display,
  parameters: {
    kit: {
      exports: ["Display", "Heading", "Text", "Eyebrow", "Highlight", "Prose"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { children: "Build the future together.", as: "h1" },
} satisfies Meta<typeof Display>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DisplayMedium: Story = { args: { size: "md" } };
export const DisplayLarge: Story = { args: { size: "lg" } };
export const DisplayExtraLarge: Story = { args: { size: "xl" } };
export const DisplayHero: Story = { args: { size: "2xl" } };
export const HeadingScale: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading as="h2" size="lg">
        Research becomes a working idea.
      </Heading>
      <Heading as="h3" size="md">
        Review the first experiment.
      </Heading>
      <Heading as="h4" size="sm">
        Choose the next useful step.
      </Heading>
    </div>
  ),
};
export const TextScale: Story = {
  render: () => (
    <div className="max-w-2xl space-y-5">
      <Text size="lead" emphasis="default">
        An introduction with a clear voice and enough room to breathe.
      </Text>
      <Text size="body">
        Body copy explains the details and connects the idea with its practical use.
      </Text>
      <Text size="small">A smaller line supports the main explanation.</Text>
      <Text size="meta" emphasis="subtle">
        Updated after the latest project review.
      </Text>
    </div>
  ),
};
export const Emphasis: Story = {
  render: () => (
    <div className="space-y-4">
      <Text emphasis="default">Primary text names the idea.</Text>
      <Text emphasis="muted">Muted text explains its context.</Text>
      <Text emphasis="subtle">Subtle text supplies a short detail.</Text>
    </div>
  ),
};
export const EyebrowPlain: Story = { render: () => <Eyebrow>Our mission</Eyebrow> };
export const EyebrowSequence: Story = { render: () => <Eyebrow index={2}>The next step</Eyebrow> };
export const AccentHighlight: Story = {
  render: () => (
    <Display as="h1">
      Build with <Highlight>purpose.</Highlight>
    </Display>
  ),
};
export const FadeHighlight: Story = {
  render: () => (
    <Display as="h1">
      Think <Highlight variant="fade">beyond today.</Highlight>
    </Display>
  ),
};
export const LongForm: Story = {
  render: () => (
    <Prose className="max-w-prose mx-auto">
      <h1 className="text-heading-lg">Project notes</h1>
      <p>
        A complete explanation starts with a useful question. The team documents its assumptions,
        shares the evidence behind the first result, and makes the next experiment understandable.
      </p>
      <h2>What the team explored</h2>
      <p>
        Research, design, and implementation contribute different perspectives.{" "}
        <strong>Make those perspectives visible</strong> so a new collaborator can follow the
        decisions.
      </p>
      <ul>
        <li>State the original question in plain language.</li>
        <li>Explain how the first result was evaluated.</li>
        <li>
          Link to the <a href="#notes">complete experiment notes</a>.
        </li>
      </ul>
      <h3>What happens next</h3>
      <p>
        Use the findings to choose a smaller, clearer next step. Keep a record of what changed and
        invite feedback where uncertainty remains.
      </p>
    </Prose>
  ),
};
export const LongHeadline: Story = {
  args: {
    size: "md",
    children:
      "Thoughtful collaboration turns an ambitious research question into something people can use.",
  },
};
