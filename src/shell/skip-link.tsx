import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

/** Props for the page's first keyboard destination. */
export type SkipLinkProps = Omit<ComponentProps<"a">, "href" | "children"> & {
  /** ID of the main content landmark. Default `main-content`; omit the leading hash. */
  targetId?: string;
  /** Visible and accessible label. Default `Skip to content`. */
  label?: string;
};

/**
 * First focusable element on a page. The link moves into view on keyboard focus
 * and skips past the fixed header to the consumer's focusable main landmark.
 */
export function SkipLink({
  targetId = "main-content",
  label = "Skip to content",
  className,
  ...props
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "top-3 left-3 bg-white px-5 py-3 font-semibold focus-visible:translate-y-0 absolute z-100 -translate-y-[200%] rounded-full text-small text-violet-950 shadow-lift transition-[translate,background-color] duration-hover hover:bg-violet-50 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {label}
    </a>
  );
}
