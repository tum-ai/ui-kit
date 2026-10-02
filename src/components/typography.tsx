import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ElementType, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { PolymorphicProps, TextElement } from "./types";

/*
 * Type components. The visual size never depends on the element: pick the
 * element for the outline (`as`) and the size for the design (`size`).
 */

const displayStyles = cva("text-fg", {
  variants: {
    /** Display step from the type scale (`text-display-*`). */
    size: {
      "2xl": "text-display-2xl",
      xl: "text-display-xl",
      lg: "text-display-lg",
      md: "text-display-md",
    },
  },
  defaultVariants: { size: "lg" },
});

/** Props for {@link Display}. */
export type DisplayProps<T extends TextElement = "h2"> = PolymorphicProps<
  T,
  VariantProps<typeof displayStyles>
>;

/** Large editorial headline. Renders an `h2` unless `as` says otherwise. */
export function Display<T extends TextElement = "h2">({
  as,
  size,
  className,
  ...props
}: DisplayProps<T>) {
  const Component = (as ?? "h2") as ElementType;
  return <Component className={cn(displayStyles({ size }), className)} {...props} />;
}

const headingStyles = cva("text-fg", {
  variants: {
    /** Heading step from the type scale (`text-heading-*`). */
    size: {
      lg: "text-heading-lg",
      md: "text-heading-md",
      sm: "text-heading-sm",
    },
  },
  defaultVariants: { size: "md" },
});

/** Props for {@link Heading}. */
export type HeadingProps<T extends TextElement = "h3"> = PolymorphicProps<
  T,
  VariantProps<typeof headingStyles>
>;

/** Card and block title. Renders an `h3` unless `as` says otherwise. */
export function Heading<T extends TextElement = "h3">({
  as,
  size,
  className,
  ...props
}: HeadingProps<T>) {
  const Component = (as ?? "h3") as ElementType;
  return <Component className={cn(headingStyles({ size }), className)} {...props} />;
}

const textStyles = cva("", {
  variants: {
    /** Body step from the type scale. */
    size: {
      lead: "text-lead",
      body: "text-body",
      small: "text-small",
      meta: "text-meta",
    },
    /** Text color within the band's tone. */
    emphasis: {
      default: "text-fg",
      muted: "text-fg-muted",
      subtle: "text-fg-subtle",
    },
  },
  defaultVariants: { size: "body", emphasis: "muted" },
});

/** The text colors {@link Text} can take. */
export type TextEmphasis = NonNullable<VariantProps<typeof textStyles>["emphasis"]>;

/** Props for {@link Text}. */
export type TextProps<T extends TextElement = "p"> = PolymorphicProps<
  T,
  VariantProps<typeof textStyles>
>;

/** Running text. Muted body copy in a `p` by default. */
export function Text<T extends TextElement = "p">({
  as,
  size,
  emphasis,
  className,
  ...props
}: TextProps<T>) {
  const Component = (as ?? "p") as ElementType;
  return <Component className={cn(textStyles({ size, emphasis }), className)} {...props} />;
}

/** Props for {@link Eyebrow}. */
export type EyebrowProps<T extends TextElement = "p"> = PolymorphicProps<
  T,
  {
    /** Editorial counter before the label: 1 renders "01", a string as is. */
    index?: string | number;
    /** The label. */
    children: ReactNode;
  }
>;

/**
 * Small sentence-case label above headlines, set like the brand guide's
 * captions ("Primary Logo"). `index` renders an editorial counter ("01")
 * separated by a short rule; use it only where the sections form a sequence.
 */
export function Eyebrow<T extends TextElement = "p">({
  as,
  index,
  className,
  children,
  ...props
}: EyebrowProps<T>) {
  const Component = (as ?? "p") as ElementType;
  return (
    <Component
      className={cn("gap-3 inline-flex items-center text-eyebrow text-fg-muted", className)}
      {...props}
    >
      {index !== undefined ? (
        <>
          <span className="text-fg-subtle tabular">
            {typeof index === "number" ? String(index).padStart(2, "0") : index}
          </span>
          <span aria-hidden="true" className="w-6 h-px bg-current opacity-50" />
        </>
      ) : null}
      <span>{children}</span>
    </Component>
  );
}

const highlightStyles = cva("", {
  variants: {
    /** `accent`: the tone's accessible accent color. `fade`: Electric Fade gradient. */
    variant: {
      accent: "text-highlight",
      fade: "text-gradient-brand",
    },
  },
  defaultVariants: { variant: "accent" },
});

/** Props for {@link Highlight}. */
export type HighlightProps = ComponentProps<"span"> & VariantProps<typeof highlightStyles>;

/** Emphasis inside a headline, e.g. the last word of a hero title. */
export function Highlight({ variant, className, ...props }: HighlightProps) {
  return <span className={cn(highlightStyles({ variant }), className)} {...props} />;
}

/** Props for {@link Prose}: a div's props. */
export type ProseProps = ComponentProps<"div">;

/** Long-form content (legal pages, rich descriptions) with brand typography. */
export function Prose({ className, ...props }: ProseProps) {
  return (
    <div
      className={cn(
        "prose max-w-none text-body",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-fg",
        "prose-h2:mt-14 prose-h2:text-heading-lg prose-h3:text-heading-md",
        "prose-p:text-fg-muted prose-strong:text-fg prose-li:text-fg-muted",
        "prose-a:font-medium prose-a:text-highlight prose-a:decoration-1 prose-a:underline-offset-4 hover:prose-a:decoration-2",
        "prose-li:marker:text-highlight prose-hr:border-hairline",
        className,
      )}
      {...props}
    />
  );
}
