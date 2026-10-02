import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";

import { Actions } from "../components/actions";
import { Aurora } from "../components/aurora";
import { BrandMark } from "../components/brand-mark";
import { Container } from "../components/container";
import { TopBlend } from "../components/top-blend";
import { cn } from "../lib/cn";
import { NavAnchor } from "./nav-anchor";
import type { NavLink, ShellLogo } from "./types";

/** A footer navigation group with caller-owned identity and content. */
export type FooterColumn = {
  /** Stable unique ID, independent of the translated or edited title. */
  id: string;
  /** Visible group heading. */
  title: string;
  /** Destinations in display order. */
  links: readonly NavLink[];
};

/** Props for {@link Footer}; no application content is fetched by the component. */
export type FooterProps = Omit<ComponentProps<"footer">, "children"> & {
  /** Caller-owned Next Image source, dimensions and alternative text. */
  logo: ShellLogo;
  /** Large introductory copy beside the navigation. */
  tagline: ReactNode;
  /** Optional actions, arranged with the kit's Actions component. */
  actions?: ReactNode;
  /** Navigation groups; IDs must be stable and unique within the page. */
  columns: readonly FooterColumn[];
  /** Optional bottom-row content; supply paragraphs or other semantic content. */
  bottomLine?: ReactNode;
};

/**
 * Synchronous, server-compatible night-tone footer with caller-owned content.
 * The source's grain, quiet aurora, decorative mark and Safari bottom blend
 * remain intact. Use stable column IDs rather than deriving IDs from headings.
 */
export function Footer({
  logo,
  tagline,
  actions,
  columns,
  bottomLine,
  className,
  ...props
}: FooterProps) {
  return (
    <footer
      data-tone="night"
      className={cn("relative isolate overflow-clip", className)}
      {...props}
    >
      <div aria-hidden className="grain -z-10" />
      <Aurora
        intensity="subtle"
        className="[mask-image:linear-gradient(to_bottom,transparent,black_35%,black_60%,transparent)]"
      />
      {/* The consumer can position this mark across a neighboring section seam. */}
      <BrandMark
        data-footer-mark=""
        className="absolute -right-[6%] -bottom-[22%] -z-10 w-[min(46rem,90%)]"
        intensity="faint"
      />
      {/* The bottom edge settles into the root canvas that Safari shows under its toolbar (docs/browser-quirks.md). */}
      <TopBlend edge="bottom" />
      <Container className={cn("pt-24 md:pt-32", !bottomLine && "pb-24 md:pb-32")}>
        <div className="gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20 grid">
          <div>
            <Image {...logo} className="h-8 w-auto" />
            <p className="mt-10 max-w-lg text-display-md text-fg">{tagline}</p>
            {actions ? <Actions className="mt-10">{actions}</Actions> : null}
          </div>
          <nav aria-label="Footer" className="gap-x-8 gap-y-12 sm:grid-cols-4 grid grid-cols-2">
            {columns.map((column) => {
              const titleId = `footer-${column.id}`;
              return (
                <div key={column.id}>
                  <p id={titleId} className="text-eyebrow text-fg-subtle">
                    {column.title}
                  </p>
                  <ul aria-labelledby={titleId} className="mt-5 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <NavAnchor
                          {...link}
                          className="-my-1.5 py-1.5 inline-block text-small text-fg-muted transition-colors duration-300 hover:text-fg"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>
        {bottomLine ? (
          <div className="mt-24 gap-3 py-8 md:flex-row md:items-center md:justify-between flex flex-col border-t border-hairline text-meta text-fg-subtle">
            {bottomLine}
          </div>
        ) : null}
      </Container>
    </footer>
  );
}
