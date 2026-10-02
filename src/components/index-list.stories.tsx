import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { IndexList } from "./index-list";

const items = [
  {
    id: "research",
    title: "Research",
    description: "Explore ideas through papers and practical experiments.",
    detail: "Open projects",
    href: "/research",
    image: { src: "/assets/placeholder.svg" },
  },
  {
    id: "community",
    title: "Community",
    description: "Meet people building with artificial intelligence.",
    detail: "Meet the teams",
    href: "/community",
    image: { src: "/assets/placeholder.svg", position: "50% 30%" },
  },
  {
    id: "events",
    title: "Events",
    description: "Join talks, workshops and collaborative challenges.",
    href: "/events",
  },
];
const meta = {
  title: "Content/IndexList",
  component: IndexList,
  parameters: {
    kit: { exports: ["IndexList"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { items },
} satisfies Meta<typeof IndexList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithMedia: Story = {
  play: async ({ canvas }) => {
    const community = canvas.getByRole("link", { name: /Community/ });
    await userEvent.hover(community);
    await waitFor(() => expect(community.closest("li")).toHaveAttribute("data-active", "true"));
    const research = canvas.getByRole("link", { name: /Research/ });
    research.focus();
    await expect(research).toHaveFocus();
    await waitFor(() => expect(research.closest("li")).toHaveAttribute("data-active", "true"));
  },
};
export const WithoutMedia: Story = {
  args: { items: items.map(({ image: _image, ...item }) => item) },
};
export const LongContent: Story = {
  args: {
    items: [
      {
        ...items[0],
        title: "InterdisciplinaryResearchCollaboration",
        description:
          "A destination with a long title and several sentences of supporting content, used to check how the typography wraps beside the thumbnail on narrow screens.",
      },
      ...items.slice(1),
    ],
  },
};
export const Responsive: Story = { globals: { viewport: { value: "narrow", isRotated: false } } };
