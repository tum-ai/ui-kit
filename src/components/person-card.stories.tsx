import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PersonCard } from "./person-card";

const meta = {
  title: "Media/PersonCard",
  component: PersonCard,
  parameters: {
    kit: {
      exports: ["PersonCard"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    name: "Alex Example",
    byline: "Research team",
    image: { src: "/assets/placeholder.svg", alt: "Abstract portrait illustration" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PersonCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const FocalPoint: Story = {
  args: {
    image: {
      src: "/assets/placeholder.svg",
      alt: "Abstract portrait illustration",
      position: "50% 20%",
    },
  },
};
export const LongContent: Story = {
  args: {
    name: "Alexandria Example Collaborator",
    byline: "Interdisciplinary research and community programs",
    children: (
      <p>
        Explores the relationship between practical experimentation, academic research and
        collaboration across several disciplines.
      </p>
    ),
  },
};
export const Responsive: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
  args: {
    children: (
      <a href="/profile" className="text-highlight underline">
        Read the profile
      </a>
    ),
  },
};
