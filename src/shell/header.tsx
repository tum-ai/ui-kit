"use client";

import { ArrowUpRight, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Anchor } from "../components/anchor";
import { BrandMark } from "../components/brand-mark";
import { ButtonLink } from "../components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../components/dialog";
import { cn } from "../lib/cn";
import { getHeaderScrollState } from "./header-scroll";
import { NavAnchor } from "./nav-anchor";
import type { NavLink, ShellLogo } from "./types";

/** Stable default, so an omitted `connectLinks` keeps one identity across renders. */
const NO_LINKS: readonly NavLink[] = [];

/** Props for {@link Header}; application navigation and branding are supplied by the caller. */
export type HeaderProps = Omit<ComponentProps<"header">, "children"> & {
  /** Main destinations, in display order. Route descendants keep their parent active. */
  navigation: readonly NavLink[];
  /** Caller-owned Next Image source, dimensions and alternative text. */
  logo: ShellLogo;
  /** Optional secondary links at the foot of the mobile menu. Default empty. */
  connectLinks?: readonly NavLink[];
  /** Resolved call to action. Omit or pass null to hide it; the caller owns scheduling. */
  cta?: NavLink | null;
  /** Destination of the logo link. Default `/`. */
  homeHref?: string;
  /** Accessible name of the logo link. Default `Home`. */
  homeLabel?: string;
  /** Frost the pill from its first render. Default false. */
  solid?: boolean;
  /** ID of the page root made inert by the mobile dialog. Default `app-root`. */
  backgroundRootId?: string;
};

/**
 * Floating site header with route highlighting and a fullscreen mobile menu.
 * The pill stays visible and frosts after scrolling. Its gap below the top edge
 * preserves Safari's page tint; the menu spans the large viewport and leaves
 * dynamic-viewport padding so long navigation remains reachable above toolbars.
 * Requires the consumer's Next App Router and the kit's shell styles.
 */
export function Header({
  navigation,
  logo,
  connectLinks = NO_LINKS,
  cta = null,
  homeHref = "/",
  homeLabel = "Home",
  solid = false,
  backgroundRootId = "app-root",
  className,
  ...props
}: HeaderProps) {
  const pathname = usePathname();
  const [menuState, setMenuState] = useState({ pathname, open: false });
  // Adjust remembered route state during rendering so no stale open menu is
  // committed after navigation, including a later return to its original route.
  if (menuState.pathname !== pathname) {
    setMenuState({ pathname, open: false });
  }
  const open = menuState.pathname === pathname && menuState.open;
  const setOpen = useCallback(
    (next: boolean) => {
      setMenuState({ pathname, open: next });
    },
    [pathname],
  );
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      // React skips the re-render when the value is unchanged.
      setScrolled(getHeaderScrollState({ scrollY: window.scrollY }).scrolled);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    // Measure on the next frame, not during the effect, so mounting renders once.
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  /* Hover/focus pill that glides between desktop nav items. */
  const movePill = useCallback(
    (event: PointerEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>) => {
      const nav = navRef.current;
      if (!nav) return;
      const target = event.currentTarget;
      nav.style.setProperty("--pill-x", `${target.offsetLeft}px`);
      nav.style.setProperty("--pill-w", `${target.offsetWidth}px`);
      nav.style.setProperty("--pill-o", "1");
    },
    [],
  );
  const hidePill = useCallback(() => {
    navRef.current?.style.setProperty("--pill-o", "0");
  }, []);

  const frosted = solid || scrolled || open;
  // An in-page anchor scrolls this page: it keeps its place on phones and
  // needs no arrow.
  const ctaInPage = cta?.href.startsWith("#") ?? false;
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Dialog open={open} onOpenChange={setOpen} backgroundRootId={backgroundRootId}>
      <header
        className={cn("inset-x-0 top-2.5 md:top-3 pointer-events-none fixed z-40", className)}
        {...props}
      >
        <div className="md:w-[min(82rem,calc(100%-2*var(--gutter)+2rem))] mx-auto w-[min(82rem,calc(100%-1.25rem))]">
          <div
            className={cn(
              "h-14 gap-2 pr-2 pl-4 text-white md:pl-5 pointer-events-auto relative flex items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-surface ease-brand",
              frosted
                ? "border-white/10 backdrop-blur-xl bg-ink-950/75 shadow-[0_16px_40px_-18px_var(--color-ink-950)] shadow-ink-950/80 backdrop-saturate-150"
                : "border-transparent bg-transparent",
            )}
          >
            <Anchor
              href={homeHref}
              aria-label={homeLabel}
              className="-mx-2 px-2 -my-1.5 py-1.5 hover:bg-white/[0.09] flex shrink-0 items-center rounded-full transition-colors duration-hover"
            >
              <Image {...logo} preload className="h-6 md:h-7 w-auto" />
            </Anchor>

            <nav
              ref={navRef}
              aria-label="Main"
              onPointerLeave={hidePill}
              className="min-w-0 xl:flex relative mx-auto hidden items-center overflow-x-auto"
            >
              <span
                aria-hidden
                className="left-0 h-9 bg-white/[0.09] pointer-events-none absolute top-1/2 w-(--pill-w) translate-x-(--pill-x) -translate-y-1/2 rounded-full opacity-[var(--pill-o,0)] transition-[translate,width,opacity] duration-hover ease-brand motion-reduce:transition-none"
              />
              {navigation.map(({ href, label, external }) => {
                const active = isActive(href);
                return (
                  <NavAnchor
                    key={href}
                    href={href}
                    label={label}
                    external={external}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={movePill}
                    onFocus={movePill}
                    onBlur={hidePill}
                    className={cn(
                      "px-3.5 py-2 font-semibold text-small/normal relative shrink-0 rounded-full whitespace-nowrap transition-colors duration-hover",
                      active ? "text-white" : "hover:text-white text-minimal-gray",
                    )}
                  >
                    {label}
                    {active ? (
                      <span
                        aria-hidden
                        className="bottom-0.5 size-1 absolute left-1/2 -translate-x-1/2 rounded-full bg-indicator"
                      />
                    ) : null}
                  </NavAnchor>
                );
              })}
            </nav>

            <div className="gap-2 xl:ml-0 ml-auto flex items-center">
              {cta ? (
                <ButtonLink
                  href={cta.href}
                  external={cta.external}
                  size="sm"
                  arrow={ctaInPage ? undefined : true}
                  className={cn("h-10", !ctaInPage && "sm:inline-flex hidden")}
                >
                  {cta.label}
                </ButtonLink>
              ) : null}
              <DialogTrigger
                aria-label="Open menu"
                className="group/menu size-10 bg-white/10 text-white hover:bg-white/20 xl:hidden grid pressable place-items-center rounded-full transition-[background-color,scale] duration-hover"
              >
                <span aria-hidden className="w-4 gap-1.25 flex flex-col">
                  <span className="motion-safe:group-hover/menu:translate-x-0.5 motion-safe:group-focus-visible/menu:translate-x-0.5 h-[1.5px] w-full rounded-full bg-current transition-transform duration-hover ease-brand" />
                  <span className="h-[1.5px] w-full origin-left scale-x-[0.667] rounded-full bg-current transition-transform duration-hover ease-brand group-hover/menu:scale-x-100 group-focus-visible/menu:scale-x-100 motion-reduce:transition-none" />
                </span>
              </DialogTrigger>
            </div>
          </div>
        </div>
      </header>

      <DialogContent variant="fullscreen" tone="ink" className="group/menu-panel max-w-md">
        <BrandMark
          drift={false}
          intensity="subtle"
          className="absolute right-[-18%] bottom-[18%] -z-10 w-[85%]"
        />
        {/*
         * The panel extends under Safari's toolbars; its content fills the
         * visible viewport. min-h-lvh + bottom padding of (lvh - dvh): when
         * the menu overflows (small phones, landscape), its last row can
         * still scroll above Safari's toolbar. See docs/browser-quirks.md.
         */}
        <div className="flex min-h-lvh flex-col pb-[calc(100lvh-100dvh)]">
          {/* Lines the close button up with the menu button it replaces. */}
          <div className="pt-2 pr-4.75 pl-6.75 md:pt-3 md:pr-[calc(var(--gutter)-0.4375rem)] md:pl-8 flex h-(--header-height) items-center justify-between">
            <Image {...logo} loading="lazy" className="h-6 md:h-7 w-auto" />
            <DialogClose
              aria-label="Close menu"
              className="size-10 bg-white/10 text-white hover:bg-white/20 grid pressable place-items-center rounded-full transition-[background-color,rotate,scale] duration-hover ease-brand motion-safe:hover:rotate-90 motion-safe:focus-visible:rotate-90"
            >
              <X aria-hidden className="size-4" />
            </DialogClose>
          </div>
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <nav aria-label="Main" className="px-6 pt-8 flex-1">
            <ul>
              {navigation.map(({ href, label, external }, index) => {
                const active = isActive(href);
                return (
                  <li
                    key={href}
                    style={{ transitionDelay: `${90 + Math.min(index, 10) * 45}ms` }}
                    className="group-data-[starting-style]/menu-panel:translate-x-8 transition-[opacity,translate] duration-media ease-brand group-data-[starting-style]/menu-panel:opacity-0 motion-reduce:transition-none"
                  >
                    <NavAnchor
                      href={href}
                      label={label}
                      external={external}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className="group/item py-4 flex items-center justify-between border-b border-hairline text-heading-lg text-fg transition-colors duration-hover hover:text-highlight"
                    >
                      <span className="min-w-0 gap-3 flex items-center">
                        <span className="min-w-0 break-words">{label}</span>
                        {active ? (
                          <span
                            aria-hidden
                            className="size-1.5 shrink-0 rounded-full bg-indicator"
                          />
                        ) : null}
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-5 -translate-x-1 group-hover/item:translate-x-0 group-focus-visible/item:translate-x-0 shrink-0 opacity-0 transition-[opacity,translate] duration-hover ease-brand group-hover/item:opacity-100 group-focus-visible/item:opacity-100 motion-reduce:transition-none"
                      />
                    </NavAnchor>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="px-6 pt-10 pb-8">
            {cta ? (
              <ButtonLink
                href={cta.href}
                external={cta.external}
                size="lg"
                arrow
                className="min-h-13 py-3 h-auto w-full text-center whitespace-normal"
                onClick={() => setOpen(false)}
              >
                {cta.label}
              </ButtonLink>
            ) : null}
            <ul className="mt-8 gap-x-6 gap-y-2 flex flex-wrap text-small text-fg-muted">
              {connectLinks.map((link) => (
                <li key={link.href}>
                  <NavAnchor
                    {...link}
                    onClick={() => setOpen(false)}
                    className="transition-colors duration-hover hover:text-fg"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
