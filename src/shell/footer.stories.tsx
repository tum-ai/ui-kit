import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { ButtonLink } from "../components/button";
import { Footer } from "./footer";
import { shellColumns, shellLogo } from "./testing";

const meta = {
  title: "Shell/Footer",
  component: Footer,
  parameters: { layout: "fullscreen", kit: { exports: ["Footer"], tones: ["night"] } },
  globals: { tone: "night" },
  args: {
    logo: shellLogo,
    tagline: "Build what comes next.",
    columns: shellColumns,
    actions: (
      <>
        <ButtonLink href="/join" arrow>
          Join the project
        </ButtonLink>
        <ButtonLink href="/collaborate" variant="outline">
          Work together
        </ButtonLink>
      </>
    ),
    bottomLine: (
      <>
        <p>Example community initiative</p>
        <p>Where ideas become useful</p>
      </>
    ),
  },
  render: (args) => (
    <>
      <main className="sr-only">
        <h1>Reusable footer demonstration</h1>
      </main>
      <Footer {...args} />
    </>
  ),
} satisfies Meta<typeof Footer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-tone", "night");
    await expect(within(footer).getByRole("list", { name: "Explore" })).toHaveAttribute(
      "aria-labelledby",
      "footer-explore",
    );
    await expect(
      within(footer).getByRole("link", { name: /^Community\s?\(opens in a new tab\)$/ }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  },
};
export const Narrow: Story = { globals: { viewport: { value: "narrow", isRotated: false } } };
export const LocalBranding: Story = {
  args: {
    logo: {
      src: "/assets/placeholder.svg",
      width: 400,
      height: 100,
      alt: "Example visual identity",
      unoptimized: true,
    },
    tagline: "A caller-owned identity.",
    actions: null,
    bottomLine: <p>All content comes from props.</p>,
  },
};
