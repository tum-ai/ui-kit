import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import axe from "axe-core";
import Image from "next/image";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Header } from "./header";
import { shellConnectLinks, shellLogo, shellNavigation } from "./testing";

const meta = {
  title: "Shell/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/projects/lab" } },
    kit: { exports: ["Header"], tones: ["ink", "night"] },
  },
  globals: { tone: "ink", viewport: { value: "phone", isRotated: false } },
  args: {
    logo: shellLogo,
    navigation: shellNavigation,
    connectLinks: shellConnectLinks,
    cta: { href: "#contact", label: "Start building" },
    homeLabel: "TUM.ai home",
  },
  render: (args) => (
    <>
      <Header {...args} />
      <main
        id="main-content"
        tabIndex={-1}
        data-tone="ink"
        className="px-6 pt-36 pb-20 min-h-[180vh] bg-canvas text-fg"
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="max-w-3xl text-display-lg">A clear path into the work.</h1>
          <p className="mt-6 max-w-xl text-lead text-fg-muted">
            Synthetic navigation and local artwork demonstrate the reusable floating shell.
          </p>
          <Image
            src="/assets/placeholder.svg"
            alt="Abstract local illustration"
            width={1200}
            height={800}
            unoptimized
            className="mt-12 w-full rounded-4xl"
          />
          <section id="contact" className="mt-24">
            <h2 className="text-display-md">Start a conversation.</h2>
            <p className="mt-4 text-body">The caller owns this content and its destinations.</p>
            <a href="#main-content" className="mt-6 inline-block text-highlight">
              Back to content
            </a>
          </section>
        </div>
      </main>
    </>
  ),
} satisfies Meta<typeof Header>;
export default meta;
type Story = StoryObj<typeof meta>;

async function waitForMenuEntrance(menu: HTMLElement) {
  await waitFor(() => expect(menu).not.toHaveAttribute("data-starting-style"));
  // Read the actual finite CSS transitions, including each row's staggered
  // delay. Contrast must be measured after opacity reaches its final value.
  await Promise.all(
    menu
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished.catch(() => undefined)),
  );
  await waitFor(async () => {
    for (const row of menu.querySelectorAll("nav li")) {
      await expect(getComputedStyle(row).opacity).toBe("1");
    }
  });
}

async function exerciseMenu(canvasElement: HTMLElement, longNavigation = false) {
  const canvas = within(canvasElement);
  const trigger = canvas.getByRole("button", { name: "Open menu", hidden: true });
  await expect(trigger).toBeVisible();
  await userEvent.click(trigger);
  const page = within(canvasElement.ownerDocument.body);
  const menu = await page.findByRole("dialog", { name: "Menu" });
  await expect(canvasElement.ownerDocument.getElementById("app-root")?.inert).toBe(true);
  await expect(within(menu).getByRole("navigation", { name: "Main" })).toBeVisible();
  if (longNavigation) {
    const last = within(menu).getByRole("link", { name: "Destination 18 with a descriptive name" });
    last.scrollIntoView({ block: "center" });
    await waitFor(() =>
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight),
    );
    await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight);
  } else {
    await expect(within(menu).getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (let step = 0; step < 9; step += 1) {
      await userEvent.tab();
      await waitFor(() =>
        expect(menu).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement),
      );
    }
  }
  await waitForMenuEntrance(menu);
  const result = await axe.run(menu, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  });
  await expect(result.violations).toEqual([]);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(trigger).toHaveFocus());
  await expect(canvasElement.ownerDocument.getElementById("app-root")?.inert).toBe(false);
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await exerciseMenu(canvasElement);
  },
};
export const Solid: Story = { args: { solid: true, cta: null }, globals: { tone: "night" } };
export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Main", hidden: true });
    await expect(within(nav).getByRole("link", { name: "Projects", hidden: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const first = within(nav).getByRole("link", { name: "Home", hidden: true });
    await expect(nav).toBeVisible();
    await userEvent.hover(first);
    await expect(nav.style.getPropertyValue("--pill-o")).toBe("1");
    await userEvent.unhover(first);
    await expect(nav.style.getPropertyValue("--pill-o")).toBe("0");
    window.scrollTo(0, 100);
    await waitFor(() =>
      expect(canvas.getByRole("banner").querySelector(".pointer-events-auto")).toHaveClass(
        "backdrop-blur-xl",
      ),
    );
    window.scrollTo(0, 0);
  },
};
export const LongMobileNavigation: Story = {
  args: {
    navigation: Array.from({ length: 18 }, (_, index) => ({
      href: `/destination-${index + 1}`,
      label: `Destination ${index + 1} with a descriptive name`,
    })),
    cta: null,
  },
  parameters: { nextjs: { navigation: { pathname: "/destination-18" } } },
  globals: { viewport: { value: "narrow", isRotated: false } },
  play: async ({ canvasElement }) => {
    await exerciseMenu(canvasElement, true);
  },
};
export const LinkDismissal: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Open menu", hidden: true });
    await expect(trigger).toBeVisible();
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(trigger);
    const menu = await page.findByRole("dialog", { name: "Menu" });
    await userEvent.click(within(menu).getByRole("link", { name: "Updates" }));
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvasElement.ownerDocument.getElementById("app-root")?.inert).toBe(false);
  },
};
