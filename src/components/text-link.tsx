import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Anchor } from "./anchor";
import { isExternalHref } from "./internal";

const textLinkStyles = cva(
  "group/link gap-1.5 font-semibold inline-flex items-center transition-colors duration-300 ease-brand",
  {
    variants: {
      /** `accent` for links in copy, `muted` for dense lists (footer, meta rows). */
      emphasis: {
        accent: "text-highlight hover:text-fg",
        muted: "text-fg-muted hover:text-fg",
      },
    },
    defaultVariants: { emphasis: "accent" },
  },
);

/** The link colors {@link TextLink} can take. */
export type TextLinkEmphasis = NonNullable<VariantProps<typeof textLinkStyles>["emphasis"]>;

/** Props for {@link TextLink}. */
export type TextLinkProps = Omit<ComponentProps<"a">, "href"> &
  VariantProps<typeof textLinkStyles> & {
    /** Route, in-page anchor, http(s), mailto: or tel: URL. */
    href: string;
    /** The visible label. */
    children: ReactNode;
    /** Trailing arrow (up and out for external links). */
    arrow?: boolean;
    /** Force new-tab behavior; defaults to true for http(s) URLs. */
    external?: boolean;
  };

/**
 * Inline link with an underline that draws in from the left on hover or
 * focus (it simply appears under reduced motion). External links open in a
 * new tab with `rel="noopener noreferrer"` and say so to screen readers.
 */
export function TextLink({
  href,
  children,
  arrow = false,
  external,
  emphasis,
  className,
  ...props
}: TextLinkProps) {
  const opensNewTab = external ?? isExternalHref(href);
  const Icon = opensNewTab ? ArrowUpRight : ArrowRight;
  return (
    <Anchor
      href={href}
      external={external}
      className={cn(textLinkStyles({ emphasis }), className)}
      {...props}
    >
      <span className="pb-0.5 bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-500 ease-brand group-hover/link:bg-[length:100%_1px] group-focus-visible/link:bg-[length:100%_1px] motion-reduce:transition-none">
        {children}
      </span>
      {arrow ? (
        <Icon
          aria-hidden="true"
          className="size-4 group-hover/link:translate-x-0.5 transition-transform duration-500 ease-brand motion-reduce:transition-none"
        />
      ) : null}
    </Anchor>
  );
}
