import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Actions } from "./actions";
import { Reveal } from "./reveal";
import type { HeadingLevel } from "./types";
import { Eyebrow } from "./typography";

const headerStyles = cva("mb-12 md:mb-16", {
  variants: {
    /**
     * `split`: title left, lead bottom-right (partner page rhythm).
     * `stack`: lead under the title. `center`: centered stack.
     */
    layout: {
      split: "gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16 flex flex-col",
      stack: "",
      center: "text-center",
    },
  },
  defaultVariants: { layout: "split" },
});

const titleStyles = cva("text-fg", {
  variants: {
    /**
     * Display step of the title: `md` for sections, `lg` for key sections,
     * `xl` for a page's lead statement.
     */
    size: {
      md: "text-display-md",
      lg: "text-display-lg",
      xl: "text-display-xl",
    },
  },
  defaultVariants: { size: "md" },
});

const asideStyles = cva("", {
  variants: {
    layout: {
      split: "lg:max-w-sm lg:pb-1.5",
      stack: "mt-6 max-w-2xl",
      center: "mt-6 max-w-2xl mx-auto",
    },
  },
  defaultVariants: { layout: "split" },
});

/** Class overrides for a section header's inner parts. */
export type SectionHeaderClassNames = {
  /** The heading. */
  title?: string;
  /** The lead paragraph. */
  lead?: string;
  /** The column that holds the lead and the actions. */
  aside?: string;
};

/** Props for {@link SectionHeader}. */
export type SectionHeaderProps = VariantProps<typeof headerStyles> &
  VariantProps<typeof titleStyles> & {
    /** The section's headline. */
    title: ReactNode;
    /**
     * A count set small and top-aligned after the title, in parentheses:
     * `count={4}` renders "Upcoming Events (4)".
     */
    count?: number;
    /** id for the heading, referenced by the section's `aria-labelledby`. */
    id?: string;
    /** Small label above the title. */
    eyebrow?: ReactNode;
    /** Editorial counter in the eyebrow, e.g. 1 → "01". */
    index?: string | number;
    /** One or two sentences that frame the section. */
    lead?: ReactNode;
    /** Buttons and status badges, laid out by <Actions>. */
    actions?: ReactNode;
    /** Heading level of the title. Default `h2`. */
    headingAs?: HeadingLevel;
    /** Class overrides for the inner parts. */
    classNames?: SectionHeaderClassNames;
    /** Classes merged over the `header` element. */
    className?: string;
  };

/** Standard section opening: eyebrow, headline, lead and optional actions. */
export function SectionHeader({
  title,
  count,
  id,
  eyebrow,
  index,
  lead,
  actions,
  layout,
  size,
  headingAs: HeadingTag = "h2",
  classNames,
  className,
}: SectionHeaderProps) {
  const heading = (
    <div className={cn(layout === "center" && "max-w-3xl mx-auto")}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={60}>
        <HeadingTag
          id={id}
          className={cn(titleStyles({ size }), eyebrow && "mt-5", classNames?.title)}
        >
          {title}
          {count !== undefined ? (
            <>
              {" "}
              <span className="ml-1 align-top text-heading-sm text-highlight tabular">
                ({count})
              </span>
            </>
          ) : null}
        </HeadingTag>
      </Reveal>
    </div>
  );

  const aside =
    lead || actions ? (
      <Reveal delay={140} className={cn(asideStyles({ layout }), classNames?.aside)}>
        {lead ? <p className={cn("text-lead text-fg-muted", classNames?.lead)}>{lead}</p> : null}
        {actions ? (
          <Actions align={layout === "center" ? "center" : "start"} className={cn(lead && "mt-6")}>
            {actions}
          </Actions>
        ) : null}
      </Reveal>
    ) : null;

  return (
    <header className={cn(headerStyles({ layout }), className)}>
      {heading}
      {aside}
    </header>
  );
}
