import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { isUnoptimizedRemoteImage } from "./internal";

/** Props for {@link QuoteMark}. */
export type QuoteMarkProps = Omit<ComponentProps<"svg">, "children" | "viewBox" | "fill">;

/**
 * The house opening quotation mark, in the tone's accent color. Decorative:
 * the quote itself sits in a `blockquote`.
 */
export function QuoteMark({ className, ...props }: QuoteMarkProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 34 24"
      fill="currentColor"
      className={cn("h-6 w-8 shrink-0 text-highlight", className)}
      {...props}
    >
      <path d="M0 24V14.4C0 6.24 4.32 1.44 12.96 0l1.44 3.36C9.6 4.8 7.2 7.68 7.2 12H13.2V24H0Zm18.8 0V14.4C18.8 6.24 23.12 1.44 31.76 0l1.44 3.36C28.4 4.8 26 7.68 26 12H32V24H18.8Z" />
    </svg>
  );
}

const quoteCardStyles = cva("relative flex h-full flex-col", {
  variants: {
    /**
     * `raised` for light bands; `glass` is the frosted panel for dark bands;
     * `editorial` drops the card and sets the quote as a large light
     * statement, for one quote that carries a section; `ruled` drops the
     * card for a hairline rule above the quote, for lists of quotes set
     * editorially on any band.
     */
    variant: {
      raised: "rounded-3xl p-7 md:p-8 border border-hairline bg-raised shadow-soft",
      glass:
        "rounded-3xl border-white/10 bg-white/[0.045] p-7 backdrop-blur-md md:p-8 border shadow-inset-hairline",
      editorial: "",
      ruled: "pt-8 border-t border-hairline-strong",
    },
  },
  defaultVariants: { variant: "raised" },
});

const quoteTextStyles = cva("flex-1 text-fg", {
  variants: {
    variant: {
      raised: "mt-6 text-lead",
      glass: "mt-6 text-lead",
      editorial: "mt-8 text-display-md",
      ruled: "mt-5 text-lead",
    },
  },
  defaultVariants: { variant: "raised" },
});

/** An image in a quote card: its source and text alternative. */
export type QuoteImage = {
  /** Image URL. Absolute http(s) URLs skip the image optimizer by default. */
  src: string;
  /** Text alternative; "" for a portrait the name already describes. */
  alt?: string;
  /** Portrait only: CSS `object-position`, e.g. from the Studio hotspot. */
  position?: string;
  /**
   * Skip optimization. Set false to optimize remote artwork and configure
   * the consumer app's `images.remotePatterns`.
   */
  unoptimized?: boolean;
};

/** Props for {@link QuoteCard}. */
export type QuoteCardProps = Omit<ComponentProps<"figure">, "children"> &
  VariantProps<typeof quoteCardStyles> & {
    /** The quotation, without quote marks. */
    quote: ReactNode;
    /** Who said it. */
    name: string;
    /**
     * Line under the name: role and affiliation. (Not `role`, which stays
     * the figure's ARIA role.)
     */
    byline?: ReactNode;
    /** Round portrait before the name. */
    portrait?: QuoteImage;
    /** Organization logo at the end of the person row. */
    logo?: QuoteImage & { alt: string };
    /** Short context beside the quote mark (e.g. a <Tag> with the cohort). */
    context?: ReactNode;
    /** Row under the person (e.g. the organization on a logo chip). */
    footer?: ReactNode;
    /** Load the images eagerly, e.g. inside a moving marquee. */
    eager?: boolean;
  };

/**
 * Testimonial: quote mark, quotation, and a person row with portrait. The
 * `editorial` variant sets the quotation in display type, without a card;
 * `ruled` sets it under a hairline, without a card.
 */
export function QuoteCard({
  quote,
  name,
  byline,
  portrait,
  logo,
  context,
  footer,
  eager = false,
  variant,
  className,
  ...props
}: QuoteCardProps) {
  const loading = eager ? "eager" : "lazy";
  return (
    <figure className={cn(quoteCardStyles({ variant }), className)} {...props}>
      <div className="min-h-7 gap-4 flex items-center justify-between">
        <QuoteMark />
        {context}
      </div>
      <blockquote className={quoteTextStyles({ variant })}>{quote}</blockquote>
      <figcaption className={variant === "editorial" ? "mt-10" : "mt-8"}>
        <div className="gap-4 flex items-center">
          {portrait ? (
            <Image
              src={portrait.src}
              alt={portrait.alt ?? ""}
              width={52}
              height={52}
              loading={loading}
              unoptimized={portrait.unoptimized ?? isUnoptimizedRemoteImage(portrait.src)}
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-hairline"
              style={{ objectPosition: portrait.position }}
            />
          ) : null}
          <div className={cn("min-w-0", variant !== "editorial" && "flex-1")}>
            <p className="text-heading-sm text-fg">{name}</p>
            {byline ? <p className="text-meta text-fg-muted">{byline}</p> : null}
          </div>
          {logo ? (
            <Image
              src={logo.src}
              alt={logo.alt}
              width={96}
              height={24}
              loading={loading}
              unoptimized={logo.unoptimized ?? isUnoptimizedRemoteImage(logo.src)}
              className={cn(
                "h-6 max-w-24 w-auto shrink-0 object-contain opacity-80",
                variant === "editorial" && "ml-2 pl-6 border-l border-hairline-strong",
              )}
            />
          ) : null}
        </div>
        {footer}
      </figcaption>
    </figure>
  );
}
