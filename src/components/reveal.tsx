"use client";

import { type CSSProperties, type ElementType, useRef } from "react";

import { useEntrance } from "./entrance";
import { useComposedRef } from "./refs";
import type { BlockElement, PolymorphicProps } from "./types";

/**
 * Entrance motions: `up` (default) rises, `fade` only fades, `scale` grows
 * slightly, `left`/`right` slide in from that side, and `line` draws a rule
 * from the left.
 */
export type RevealVariant = "up" | "fade" | "scale" | "left" | "right" | "line";

/** Props for {@link Reveal}. */
export type RevealProps<T extends BlockElement = "div"> = PolymorphicProps<
  T,
  {
    /** Entrance motion. Default `up`. */
    variant?: RevealVariant;
    /** Delay in ms; use `index * 80` for staggered lists. */
    delay?: number;
  }
>;

/**
 * Scroll-triggered entrance. Progressive enhancement by construction:
 * server HTML and no-JS visitors see content immediately (`data-reveal="idle"`
 * has no hiding styles); only elements that start below the fold are hidden
 * after hydration and revealed once. Reduced motion disables it entirely.
 * For above-the-fold content use the CSS `motion-safe:animate-rise*`
 * utilities instead.
 */
export function Reveal<T extends BlockElement = "div">({
  as,
  variant = "up",
  delay = 0,
  style,
  ref,
  children,
  ...props
}: RevealProps<T>) {
  const ownRef = useRef<HTMLElement>(null);
  const composedRef = useComposedRef<HTMLElement>(ownRef, ref);
  const state = useEntrance(ownRef);

  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      ref={composedRef}
      data-reveal={state}
      data-reveal-variant={variant}
      style={delay ? ({ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties) : style}
      {...props}
    >
      {children}
    </Component>
  );
}
