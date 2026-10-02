import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { ButtonLink } from "./button";
import { PageHero } from "./page-hero";
import { Photo } from "./photo";
import { StatGrid } from "./stat";
import { Highlight } from "./typography";

const meta = {
  title: "Compositions/PageHero",
  component: PageHero,
  parameters: { layout: "fullscreen", kit: { exports: ["PageHero"], tones: ["ink", "night"] } },
  args: {
    titleId: "kit-hero-title",
    eyebrow: "A place to build",
    title: "Ideas become possibilities",
    lead: "Bring a clear question, meet a different perspective, and make something useful together.",
    actions: (
      <>
        <ButtonLink href="#explore" arrow>
          Explore the possibilities
        </ButtonLink>
        <ButtonLink href="#details" variant="outline">
          Read the details
        </ButtonLink>
      </>
    ),
  },
} satisfies Meta<typeof PageHero>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Ideas become possibilities" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("region", { name: "Ideas become possibilities" }),
    ).toHaveAttribute("data-tone", "ink");
  },
};
export const WithMedia: Story = {
  args: {
    media: (
      <Photo
        src="/assets/placeholder.svg"
        alt="Abstract violet composition used to demonstrate the media column"
        caption="Local image fixture"
        sizes="(min-width: 1024px) 45vw, 100vw"
        unoptimized
      />
    ),
  },
};
export const HighlightedTitle: Story = { args: { emphasis: "highlight" } };
export const Night: Story = { args: { tone: "night" } };
export const FitLongWord: Story = {
  args: {
    size: "fit",
    title: "Datenschutzerklärung",
    eyebrow: "An example of a long word",
    lead: "The fit size keeps a single long word within a narrow screen.",
    actions: undefined,
  },
};
export const Medium: Story = { args: { size: "md" } };
export const ExtraLarge: Story = { args: { size: "xl", title: "Build together" } };
export const MarkedWordsAndFooter: Story = {
  args: {
    title: (
      <>
        Build the <Highlight>next idea</Highlight> together
      </>
    ),
    children: (
      <StatGrid
        columns={3}
        size="sm"
        items={[
          { label: "Example teams", value: "12" },
          { label: "Example projects", value: "24" },
          { label: "Example disciplines", value: "8" },
        ]}
      />
    ),
  },
};
export const CustomTitle: Story = {
  args: {
    title: (
      <>
        One question.
        <br />
        Many perspectives.
      </>
    ),
    splitTitle: false,
    mark: false,
    classNames: { title: "max-w-4xl" },
  },
};
