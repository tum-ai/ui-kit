import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { LogoTile, LogoWall } from "./logo-wall";

const logos = [
  { name: "TUM.ai", src: "/assets/tum_ai_logo_new.svg", aspectRatio: 477 / 406 },
  { name: "Community laboratory", href: "https://example.org" },
  { name: "Research studio", src: "/assets/placeholder.svg", aspectRatio: 3 / 2 },
  { name: "A collaborative organization with a long name" },
];
const meta = {
  title: "Media/LogoWall",
  component: LogoWall,
  parameters: {
    kit: {
      exports: ["LogoWall", "LogoTile"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { logos, label: "Collaborators" },
} satisfies Meta<typeof LogoWall>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Grid: Story = {};
export const Strip: Story = {
  args: { layout: "strip", logos: logos.slice(0, 3) },
  globals: { tone: "mist" },
};
export const ResponsiveLargeTiles: Story = {
  render: () => (
    <div className="gap-3 sm:grid-cols-3 grid grid-cols-2">
      {logos.map((logo) => (
        <LogoTile key={logo.name} {...logo} size="xl" responsive />
      ))}
    </div>
  ),
  globals: { viewport: { value: "phone", isRotated: false } },
};
export const TileVariants: Story = {
  render: () => (
    <div className="gap-8 sm:grid-cols-2 grid items-start">
      <LogoTile name="TUM.ai" src="/assets/tum_ai_logo_new.svg" variant="tile" />
      <LogoTile name="TUM.ai" src="/assets/tum_ai_logo_new.svg" variant="chip" fixed />
      <LogoTile name="TUM.ai" src="/assets/tum_ai_logo_new.svg" variant="bare" />
      <LogoTile name="Research laboratory" src="/assets/tum_ai_logo_new.svg" variant="mono" />
    </div>
  ),
};
export const Wordmark: Story = {
  render: () => (
    <LogoTile name="TUM.ai" src="/assets/tum_ai_logo_new.svg" wordmark="TUM.ai" variant="chip" />
  ),
};
export const MissingArtworkAndKeyboardLink: Story = {
  args: { logos: [logos[1], logos[3]] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /Community laboratory/ })).toHaveFocus();
  },
};
export const LoadError: Story = {
  args: { logos: [logos[0]] },
  play: async ({ canvas }) => {
    canvas.getByRole("img", { name: "TUM.ai" }).dispatchEvent(new Event("error"));
    await expect(canvas.findByText("TUM.ai")).resolves.toBeVisible();
  },
};
