import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Actions } from "./actions";
import { BrandMark } from "./brand-mark";
import { Container } from "./container";
import { Reveal } from "./reveal";
import { Section, type Tone } from "./section";
import type { HeadingLevel } from "./types";
import { Eyebrow } from "./typography";

/**
 * The inset ink surface of <CtaBand variant="panel">: flat brand ink and,
 * with `mark`, the drifting logomark, clipped to `rounded-5xl`.
 */
function CtaPanel({
  mark,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { mark: boolean }) {
  return (
    <div
      data-tone="ink"
      className={cn("relative isolate overflow-clip rounded-5xl", className)}
      {...props}
    >
      {mark ? (
        <BrandMark
          intensity="soft"
          className="absolute -right-[8%] -bottom-[35%] -z-10 w-[min(44rem,80%)]"
        />
      ) : null}
      {children}
    </div>
  );
}

/** Class overrides for a CTA band's inner parts (merged over the defaults). */
export type CtaBandClassNames = {
  /** The centered text column. */
  content?: string;
  /** The heading. */
  title?: string;
  /** The lead paragraph. */
  lead?: string;
  /** The <Actions> row around `actions`. */
  actions?: string;
  /** The wrapper around `children`. */
  footer?: string;
};

/** Props for {@link CtaBand}. */
export type CtaBandProps = {
  /** The closing statement. */
  title: ReactNode;
  /** Small label above the title. */
  eyebrow?: ReactNode;
  /** Large icon or artwork above the title (decorative; hide it from AT). */
  visual?: ReactNode;
  /** One or two sentences under the title. */
  lead?: ReactNode;
  /** Buttons and status badges, laid out by <Actions>. */
  actions?: ReactNode;
  /**
   * Content under the lead that brings its own layout (e.g. a feature's
   * contact row that is already an <Actions>), revealed after `actions`.
   */
  children?: ReactNode;
  /** id of the heading, referenced by the section's `aria-labelledby`. */
  titleId?: string;
  /** Heading level of the title. Default `h2`. */
  headingAs?: HeadingLevel;
  /** Anchor id for the section (e.g. "contact"). */
  id?: string;
  /**
   * `panel`: rounded ink panel inset in a light band (default).
   * `band`: full-bleed dark band.
   */
  variant?: "panel" | "band";
  /** Surrounding band tone for the `panel` variant. Default `paper`. */
  tone?: Tone;
  /**
   * The drifting logomark behind the content. Default true; turn it off
   * when `visual` is the band's artwork, so the two don't compete.
   */
  mark?: boolean;
  /** Class overrides for the inner parts. */
  classNames?: CtaBandClassNames;
  /** Classes merged over the section. */
  className?: string;
};

/** Closing call to action on flat ink, with the drifting logomark by default. */
export function CtaBand({
  title,
  eyebrow,
  visual,
  lead,
  actions,
  children,
  titleId,
  headingAs: HeadingTag = "h2",
  id,
  variant = "panel",
  tone = "paper",
  mark = true,
  classNames,
  className,
}: CtaBandProps) {
  const inner = (
    <div className={cn("max-w-3xl relative mx-auto text-center", classNames?.content)}>
      {visual ? <Reveal variant="scale">{visual}</Reveal> : null}
      {eyebrow ? (
        <Reveal>
          <Eyebrow className={cn(visual && "mt-6 md:mt-8")}>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={60}>
        <HeadingTag
          id={titleId}
          className={cn(
            "text-display-lg text-fg",
            eyebrow ? "mt-5" : visual && "mt-6 md:mt-8",
            classNames?.title,
          )}
        >
          {title}
        </HeadingTag>
      </Reveal>
      {lead ? (
        <Reveal delay={140}>
          <p className={cn("mt-6 max-w-xl mx-auto text-lead text-fg-muted", classNames?.lead)}>
            {lead}
          </p>
        </Reveal>
      ) : null}
      {actions ? (
        <Reveal delay={220}>
          <Actions align="center" className={cn("mt-10", classNames?.actions)}>
            {actions}
          </Actions>
        </Reveal>
      ) : null}
      {children ? (
        <Reveal delay={actions ? 300 : 220} className={cn("mt-10", classNames?.footer)}>
          {children}
        </Reveal>
      ) : null}
    </div>
  );

  if (variant === "band") {
    return (
      <Section
        tone="ink"
        spacing="xl"
        id={id}
        aria-labelledby={titleId}
        className={cn("overflow-clip", className)}
      >
        {mark ? (
          <BrandMark
            className="absolute -bottom-[30%] left-1/2 -z-10 w-[min(70rem,110%)] -translate-x-1/2"
            intensity="subtle"
          />
        ) : null}
        <Container>{inner}</Container>
      </Section>
    );
  }

  return (
    <Section tone={tone} spacing="md" id={id} aria-labelledby={titleId} className={className}>
      <Container>
        <Reveal variant="scale">
          <CtaPanel mark={mark} className="px-6 py-20 md:px-16 md:py-28">
            {inner}
          </CtaPanel>
        </Reveal>
      </Container>
    </Section>
  );
}
