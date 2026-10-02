import type { ComponentProps } from "react";

import { Anchor } from "../components/anchor";
import type { NavLink } from "./types";

/** A navigation entry plus native anchor attributes and an optional content slot. */
export type NavAnchorProps = NavLink & Omit<ComponentProps<"a">, "href">;

/**
 * Navigation link through Anchor: internal routes use Next Link, external
 * destinations announce their new tab, and fragments or contact links stay native.
 * Children can extend the label with a decorative active indicator.
 */
export function NavAnchor({ label, href, children = label, ...props }: NavAnchorProps) {
  return (
    <Anchor href={href} {...props}>
      {children}
    </Anchor>
  );
}
