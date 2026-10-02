"use client";

import { type CSSProperties, type ElementType, useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "./internal";
import { useComposedRef } from "./refs";
import type { BlockElement, PolymorphicProps } from "./types";

/**
 * Entrance motions: `up` (default) rises, `fade` only fades, `scale` grows
 * slightly, `left`/`right` slide in from that side, and `line` draws a rule
 * from the left.
 */
export type RevealVariant = "up" | "fade" | "scale" | "left" | "right" | "line";

type RevealState = "idle" | "pending" | "done";

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

/* One shared observer for every Reveal on the page. */
const listeners = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function observe(node: Element, onEnter: () => void) {
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        listeners.get(entry.target)?.();
        listeners.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  listeners.set(node, onEnter);
  sharedObserver.observe(node);
  return () => {
    listeners.delete(node);
    sharedObserver?.unobserve(node);
  };
}

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
  const own = useRef<HTMLElement>(null);
  const composedRef = useComposedRef<HTMLElement>(own, ref);
  const [state, setState] = useState<RevealState>("idle");

  useEffect(() => {
    const node = own.current;
    if (!node) return;
    if (prefersReducedMotion()) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.94) return;

    setState("pending");
    return observe(node, () => setState("done"));
  }, []);

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
