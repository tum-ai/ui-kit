import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { isExternalHref, isNonRouteHref } from "./internal";

/** Props for {@link Anchor}: an `a` element's props with a required `href`. */
export type AnchorProps = Omit<ComponentProps<"a">, "href"> & {
  /** Route, in-page anchor, http(s), mailto: or tel: URL. */
  href: string;
  /** Force new-tab behavior; defaults to true for http(s) URLs. */
  external?: boolean;
  /** The link content; it names the link. */
  children?: ReactNode;
};

/**
 * Unstyled, route-aware link, the one place that decides how a link opens.
 * Site routes go through next/link; http(s) URLs (or `external`) open in a new
 * tab with `rel="noopener noreferrer"` and tell screen readers so; mailto:,
 * tel: and in-page anchors stay plain `<a>` elements. `ButtonLink`, `TextLink`
 * and `LogoTile` link through it; use it directly for links that
 * bring their own styling (navigation lists, footers).
 */
export function Anchor({ href, external, children, ...props }: AnchorProps) {
  const opensNewTab = external ?? isExternalHref(href);

  if (opensNewTab || isNonRouteHref(href)) {
    return (
      <a
        href={href}
        target={opensNewTab ? "_blank" : undefined}
        rel={opensNewTab ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
        {opensNewTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
