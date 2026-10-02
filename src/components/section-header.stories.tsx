import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { ButtonLink } from "./button";
import { Container } from "./container";
import { Section } from "./section";
import { SectionHeader } from "./section-header";

const meta = {
  title: "Compositions/SectionHeader",
  component: SectionHeader,
  parameters: {
    layout: "fullscreen",
    kit: {
      exports: ["SectionHeader"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    id: "kit-section-title",
    eyebrow: "Different perspectives",
    index: 1,
    title: "Room for your next idea",
    lead: "A short introduction frames what follows without repeating the headline.",
    actions: (
      <ButtonLink href="#ideas" variant="outline" arrow>
        Explore ideas
      </ButtonLink>
    ),
  },
  render: (args) => (
    <Section spacing="lg" aria-labelledby={args.id}>
      <Container>
        <SectionHeader {...args} />
        <p className="max-w-2xl text-body text-fg-muted">
          The section content begins below the heading.
        </p>
      </Container>
    </Section>
  ),
} satisfies Meta<typeof SectionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Split: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("heading", { level: 2, name: "Room for your next idea" }),
    ).toBeVisible();
  },
};
export const Stack: Story = { args: { layout: "stack" } };
export const Center: Story = { args: { layout: "center" } };
export const Large: Story = { args: { size: "lg" } };
export const ExtraLarge: Story = {
  args: { size: "xl", title: "Where ideas grow", layout: "stack" },
};
export const WithCount: Story = { args: { title: "Example projects", count: 4 } };
export const EmptyCount: Story = { args: { title: "Archived examples", count: 0 } };
export const LongContent: Story = {
  args: {
    title: "A longer section headline that keeps its rhythm across a narrow screen",
    lead: "A longer introduction can explain the purpose of a section, who it is for, and how the reader can make the most of the material below. The title and the introduction remain two clearly related parts of one opening.",
    layout: "stack",
  },
};
