import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType } from "react";

import { cn } from "../lib/cn";
import type { BlockElement, PolymorphicProps } from "./types";

/**
 * Band tones (`data-tone`). Light: paper, mist, lavender. Dark: ink, night.
 * Violet is the brand band, for large type only.
 */
export type Tone = "paper" | "mist" | "lavender" | "ink" | "night" | "violet";

const sectionStyles = cva("relative isolate", {
  variants: {
    /** Vertical padding step. `none` for heroes that set their own. */
    spacing: {
      none: "",
      sm: "py-14 md:py-20",
      md: "py-20 md:py-28",
      lg: "py-24 md:py-36",
      xl: "py-28 md:py-44",
    },
  },
  defaultVariants: { spacing: "md" },
});

/** Props for {@link Section}. */
export type SectionProps<T extends BlockElement = "section"> = PolymorphicProps<
  T,
  VariantProps<typeof sectionStyles> & {
    /** Surface band. Sets the semantic color tokens for everything inside. */
    tone?: Tone;
    /** Film grain overlay; use on dark bands only. */
    grain?: boolean;
  }
>;

/**
 * A full-bleed page band. Children read `bg-canvas`, `text-fg`,
 * `text-fg-muted`, `border-hairline` and `text-highlight`, which resolve per
 * tone, so the same component works on light and dark bands. Adjacent bands
 * of close tints blend softly at the seam (see `[data-band]` in src/styles/tailwind.css).
 * Give it `aria-labelledby` pointing at its heading.
 */
export function Section<T extends BlockElement = "section">({
  as,
  tone = "paper",
  spacing,
  grain = false,
  className,
  children,
  ...props
}: SectionProps<T>) {
  const Component = (as ?? "section") as ElementType;
  return (
    <Component
      data-tone={tone}
      data-band=""
      className={cn(sectionStyles({ spacing }), className)}
      {...props}
    >
      {grain ? <div aria-hidden="true" className="grain -z-10" /> : null}
      {children}
    </Component>
  );
}
