import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Actions } from "./actions";
import { BrandMark } from "./brand-mark";
import { Container } from "./container";
import { Section, type Tone } from "./section";
import { SplitWords } from "./split-words";
import { TopBlend } from "./top-blend";
import { Eyebrow } from "./typography";

const titleStyles = cva("", {
  variants: {
    /**
     * Display step of the headline. `fit` is `md` capped so a single word of
     * about ten em (a German compound such as "Datenschutzerklärung") still
     * fits a phone column: word-by-word titles can't hyphenate.
     */
    size: {
      fit: "text-display-fit",
      md: "text-display-lg",
      lg: "text-display-xl",
      xl: "text-display-2xl",
    },
    /**
     * Title colour. `highlight` sets the whole headline in the tone's accent
     * (Electric Lavender on the dark bands), as the brand guide's section
     * slides do; keep `default` when the title marks words with <Highlight>.
     */
    emphasis: {
      default: "text-fg",
      highlight: "text-highlight",
    },
  },
  defaultVariants: { size: "lg", emphasis: "default" },
});

/** Class overrides for a page hero's inner parts (merged over the defaults). */
export type PageHeroClassNames = {
  /** The two-column grid, when there is `media` (column ratio, alignment). */
  grid?: string;
  /** The text column. */
  content?: string;
  /** The `h1`. */
  title?: string;
  /** The lead. */
  lead?: string;
  /** The <Actions> row around `actions`. */
  actions?: string;
  /** The wrapper around `media`. */
  media?: string;
  /** The wrapper around `children`, below the headline block. */
  footer?: string;
};

/** Props for {@link PageHero}. */
export type PageHeroProps = VariantProps<typeof titleStyles> & {
  /** The page's `h1`. */
  title: ReactNode;
  /** Small label above the title. */
  eyebrow?: ReactNode;
  /** One or two sentences under the title. */
  lead?: ReactNode;
  /** Buttons and status badges, laid out by <Actions>. */
  actions?: ReactNode;
  /** Right column (image, card, stats). Stacks under the text on mobile. */
  media?: ReactNode;
  /** Content below the headline block (stats row, filters, tabs, a marquee). */
  children?: ReactNode;
  /**
   * Animate the title word by word (<SplitWords>). Set false when the title
   * brings its own SplitWords, e.g. one per line with custom delays.
   */
  splitTitle?: boolean;
  /** Dark band tone. Default `ink`. */
  tone?: Extract<Tone, "ink" | "night">;
  /** Large drifting logomark in the background. Default true. */
  mark?: boolean;
  /** id of the `h1`, referenced by the section's `aria-labelledby`. */
  titleId?: string;
  /** Class overrides for the inner parts. */
  classNames?: PageHeroClassNames;
  /** Classes merged over the section (e.g. its top and bottom padding). */
  className?: string;
};

/**
 * Opening band for every page: a flat dark tone, a drifting logomark and a
 * word-by-word headline. Everything above the fold animates with
 * CSS only, so it starts before hydration and doesn't hold back LCP. Top
 * padding clears the fixed header.
 */
export function PageHero({
  title,
  eyebrow,
  lead,
  actions,
  media,
  children,
  size,
  emphasis,
  splitTitle = true,
  tone = "ink",
  mark = true,
  titleId,
  classNames,
  className,
}: PageHeroProps) {
  return (
    <Section
      tone={tone}
      spacing="none"
      aria-labelledby={titleId}
      className={cn(
        "overflow-clip pt-[calc(var(--header-height)+clamp(3rem,7vw,6rem))] pb-[clamp(3.5rem,7vw,6rem)]",
        className,
      )}
    >
      {mark ? (
        <BrandMark
          className="absolute top-[6%] -right-[12%] -z-10 w-[min(64rem,78%)]"
          intensity="subtle"
        />
      ) : null}
      <TopBlend />
      <Container>
        <div
          className={cn(
            media &&
              "gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16 grid",
            media && classNames?.grid,
          )}
        >
          <div className={cn(!media && "max-w-5xl", classNames?.content)}>
            {eyebrow ? <Eyebrow className="motion-safe:animate-rise-sm">{eyebrow}</Eyebrow> : null}
            <h1
              id={titleId}
              className={cn(titleStyles({ size, emphasis }), eyebrow && "mt-6", classNames?.title)}
            >
              {splitTitle ? <SplitWords delay={80}>{title}</SplitWords> : title}
            </h1>
            {lead ? (
              <div
                className={cn(
                  "mt-7 max-w-2xl text-lead text-fg-muted [animation-delay:380ms] motion-safe:animate-rise-sm",
                  classNames?.lead,
                )}
              >
                {lead}
              </div>
            ) : null}
            {actions ? (
              <Actions
                className={cn(
                  "mt-10 [animation-delay:520ms] motion-safe:animate-rise-sm",
                  classNames?.actions,
                )}
              >
                {actions}
              </Actions>
            ) : null}
          </div>
          {media ? (
            <div
              className={cn(
                "[animation-delay:260ms] motion-safe:animate-rise-sm",
                classNames?.media,
              )}
            >
              {media}
            </div>
          ) : null}
        </div>
        {children ? (
          <div
            className={cn(
              "mt-14 md:mt-20 [animation-delay:640ms] motion-safe:animate-rise-sm",
              classNames?.footer,
            )}
          >
            {children}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
