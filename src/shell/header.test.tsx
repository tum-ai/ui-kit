import { axe } from "@test/axe";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { stubMatchMedia, stubObservers } from "../components/testing";
import { Header, type HeaderProps } from "./header";
import { headerFrostAfter } from "./header-scroll";
import { shellConnectLinks, shellLogo, shellNavigation } from "./testing";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/projects") }));

function renderHeader(pathname = "/projects", props: Partial<HeaderProps> = {}) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  const headerProps: HeaderProps = { navigation: shellNavigation, logo: shellLogo, ...props };
  const rootId = props.backgroundRootId ?? "app-root";
  const page = (
    <div id={rootId}>
      <Header {...headerProps} />
      <main id="main-content">
        <h1>Application content</h1>
        <a href="#behind">Behind the menu</a>
      </main>
    </div>
  );
  return { ...render(page), headerProps, rootId };
}

beforeEach(() => {
  window.scrollY = 0;
  stubMatchMedia();
  stubObservers();
});
afterEach(() => {
  window.scrollY = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("caller-owned shell content", () => {
  test("uses supplied logo dimensions, alternative text and home destination", () => {
    renderHeader("/projects", {
      logo: {
        src: "/assets/placeholder.svg",
        width: 480,
        height: 120,
        alt: "Example identity",
        unoptimized: true,
      },
      homeHref: "/welcome",
      homeLabel: "Example home",
      className: "custom-header",
      id: "custom-shell",
    });
    const logo = screen.getByRole("img", { name: "Example identity" });
    expect(logo).toHaveAttribute("src", "/assets/placeholder.svg");
    expect(logo).toHaveAttribute("width", "480");
    expect(logo).toHaveAttribute("height", "120");
    expect(screen.getByRole("link", { name: "Example home" })).toHaveAttribute("href", "/welcome");
    expect(screen.getByRole("banner")).toHaveClass("custom-header");
  });
  test("omitted or null CTA leaves only home and navigation links", () => {
    renderHeader("/projects", { cta: null });
    expect(within(screen.getByRole("banner")).getAllByRole("link", { hidden: true })).toHaveLength(
      shellNavigation.length + 1,
    );
  });
  test("uses the caller's resolved CTA and updates when its props change", () => {
    const { rerender, headerProps } = renderHeader("/projects", {
      cta: { href: "/join", label: "Start building" },
    });
    expect(screen.getByRole("link", { name: "Start building" })).toHaveAttribute("href", "/join");
    rerender(
      <div id="app-root">
        <Header {...headerProps} cta={{ href: "#contact", label: "Talk to us" }} />
      </div>,
    );
    expect(screen.queryByRole("link", { name: "Start building" })).toBeNull();
    expect(screen.getByRole("link", { name: "Talk to us" })).toHaveAttribute("href", "#contact");
  });
  test("in-page CTA stays available on the smallest screen without an arrow", () => {
    renderHeader("/projects", { cta: { href: "#contact", label: "Contact" } });
    const cta = screen.getByRole("link", { name: "Contact" });
    expect(cta).not.toHaveClass("hidden");
    expect(cta.querySelector("svg")).toBeNull();
  });
  test("main navigation supports external destinations and overrides", () => {
    renderHeader("/projects", {
      navigation: [
        { href: "https://example.com/community", label: "Community" },
        { href: "https://example.com/help", label: "Help", external: false },
      ],
    });
    expect(
      screen.getByRole("link", { name: /^Community\s?\(opens in a new tab\)$/ }),
    ).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Help" })).not.toHaveAttribute("target");
  });
});

describe("active route", () => {
  test.each([
    ["/projects", "Projects"],
    ["/projects/lab", "Projects"],
    ["/", "Home"],
  ])("marks %s in desktop navigation", (pathname, name) => {
    renderHeader(pathname);
    const navigation = within(screen.getByRole("navigation", { name: "Main" }));
    expect(navigation.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
    expect(
      navigation
        .getAllByRole("link")
        .filter((link) => link.getAttribute("aria-current") === "page"),
    ).toHaveLength(1);
  });
  test("does not mark a route with a similar prefix", () => {
    renderHeader("/projects-archive");
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
    expect(
      within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Home" }),
    ).not.toHaveAttribute("aria-current");
  });
});

describe("scroll frosting", () => {
  const pill = () => screen.getByRole("banner").querySelector(".pointer-events-auto");
  test("frosts once scrolled and becomes transparent at the top", async () => {
    renderHeader();
    expect(pill()).toHaveClass("bg-transparent");
    window.scrollY = headerFrostAfter + 1;
    fireEvent.scroll(window);
    await waitFor(() => expect(pill()).toHaveClass("backdrop-blur-xl"));
    window.scrollY = 0;
    fireEvent.resize(window);
    await waitFor(() => expect(pill()).toHaveClass("bg-transparent"));
  });
  test("solid is applied from the first render", () => {
    renderHeader("/projects", { solid: true });
    expect(pill()).toHaveClass("backdrop-blur-xl");
  });
  test("cancels a pending animation frame on unmount", () => {
    const request = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(41);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = renderHeader();
    fireEvent.scroll(window);
    fireEvent.resize(window);
    expect(request).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancel).toHaveBeenCalledWith(41);
  });
});

describe("mobile menu", () => {
  test("opens a named modal with active navigation, traps focus and returns it on Escape", async () => {
    const user = userEvent.setup();
    const { baseElement } = renderHeader("/projects/lab");
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(document.getElementById("app-root")?.inert).toBe(true);
    const nav = within(menu).getByRole("navigation", { name: "Main" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(shellNavigation.map((link) => link.label));
    expect(within(nav).getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (let step = 0; step < 8; step += 1) {
      await user.tab();
      await waitFor(() => expect(menu).toContainElement(document.activeElement as HTMLElement));
    }
    expect(await axe(baseElement)).toHaveNoViolations();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.getElementById("app-root")?.inert).toBe(false);
  });
  test("passes a custom background root through to Dialog", async () => {
    const user = userEvent.setup();
    renderHeader("/projects", { backgroundRootId: "consumer-page" });
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await screen.findByRole("dialog");
    expect(document.getElementById("consumer-page")?.inert).toBe(true);
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.getElementById("consumer-page")?.inert).toBe(false);
  });
  test.each(["navigation", "cta", "connect"] as const)(
    "dismisses when the %s link is selected",
    async (kind) => {
      const user = userEvent.setup();
      renderHeader("/projects", {
        cta: { href: "#contact", label: "Contact" },
        connectLinks: [{ href: "#social", label: "Social" }],
      });
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const menu = await screen.findByRole("dialog");
      const name = kind === "navigation" ? "Updates" : kind === "cta" ? "Contact" : "Social";
      await user.click(within(menu).getByRole("link", { name }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    },
  );
  test("dismisses on an independently triggered route change", async () => {
    const user = userEvent.setup();
    const { rerender, headerProps } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await screen.findByRole("dialog");
    act(() => {
      vi.mocked(usePathname).mockReturnValue("/updates");
    });
    rerender(
      <div id="app-root">
        <Header {...headerProps} />
      </div>,
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("link", { name: "Updates" })).toHaveAttribute("aria-current", "page");
  });
  test("external connect links announce the new tab while contact links stay native", async () => {
    const user = userEvent.setup();
    renderHeader("/projects", { connectLinks: shellConnectLinks });
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = await screen.findByRole("dialog");
    expect(
      within(menu).getByRole("link", { name: /^Community\s?\(opens in a new tab\)$/ }),
    ).toHaveAttribute("target", "_blank");
    expect(within(menu).getByRole("link", { name: "Say hello" })).not.toHaveAttribute("target");
  });
  test("retains large-viewport scroll padding and every long-navigation destination", async () => {
    const user = userEvent.setup();
    const navigation = Array.from({ length: 18 }, (_, index) => ({
      href: `/destination-${index}`,
      label: `Destination ${index + 1} with a descriptive name`,
    }));
    renderHeader("/destination-17", { navigation });
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = await screen.findByRole("dialog");
    expect(menu).toHaveClass("h-lvh", "overflow-y-auto");
    expect(menu.querySelector(".min-h-lvh")).toHaveClass("pb-[calc(100lvh-100dvh)]");
    expect(within(menu).getAllByRole("link")).toHaveLength(navigation.length);
    expect(within(menu).getByRole("link", { name: navigation[17].label })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
