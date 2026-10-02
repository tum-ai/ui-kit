"use client";

import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "../lib/cn";
import { formatFigure, type ParsedFigure, parseFigure } from "./figure";
import { prefersReducedMotion } from "./internal";

/** `--ease-brand` as a framer-motion cubic bezier. */
const easeBrand = [0.22, 1, 0.36, 1] as const;

/** Props for {@link CountUp}. */
export type CountUpProps = {
  /**
   * A number, formatted with the props below, or a copy figure ("1.2M+",
   * "2.3%") that counts up and always settles on the exact source text.
   */
  value: number | string;
  /** Text before a numeric value, e.g. "~". Ignored for strings. */
  prefix?: string;
  /** Text after a numeric value, e.g. "+". Ignored for strings. */
  suffix?: string;
  /** Fraction digits of a numeric value. Ignored for strings. */
  decimals?: number;
  /** Thousands separators for a numeric value ("2,100"); default true. */
  grouping?: boolean;
  /** Seconds. Default 1.2, the longest entrance the motion rules allow. */
  duration?: number;
  /** Classes merged over the wrapper (which sets tabular figures). */
  className?: string;
};

/**
 * Number that counts up when scrolled into view. The server renders the final
 * value (SEO, no-JS, reduced motion), screen readers always get the final
 * value, and numbers already visible on load are left untouched to avoid a
 * flash.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  grouping = true,
  duration = 1.2,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const figure: ParsedFigure | null =
    typeof value === "number" ? { prefix, value, decimals, grouping, suffix } : parseFigure(value);
  const finalText =
    typeof value === "string" || !figure ? String(value) : formatFigure(value, figure);

  // Primitives only, so the effect doesn't rerun for an equal figure.
  const target = figure?.value;
  const figurePrefix = figure?.prefix ?? "";
  const figureSuffix = figure?.suffix ?? "";
  const figureDecimals = figure?.decimals ?? 0;
  const figureGrouping = figure?.grouping ?? false;

  useEffect(() => {
    const node = ref.current;
    if (!node || target === undefined) return;
    if (prefersReducedMotion()) return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    const parts = {
      prefix: figurePrefix,
      suffix: figureSuffix,
      decimals: figureDecimals,
      grouping: figureGrouping,
    };
    node.textContent = formatFigure(0, parts);
    let stop: (() => void) | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const controls = animate(0, target, {
          duration,
          ease: easeBrand,
          onUpdate: (latest) => {
            node.textContent = formatFigure(latest, parts);
          },
          onComplete: () => {
            node.textContent = finalText;
          },
        });
        stop = () => controls.stop();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop?.();
      node.textContent = finalText;
    };
  }, [target, figurePrefix, figureSuffix, figureDecimals, figureGrouping, finalText, duration]);

  return (
    <span className={cn("tabular", className)}>
      <span aria-hidden="true" ref={ref}>
        {finalText}
      </span>
      <span className="sr-only">{finalText}</span>
    </span>
  );
}
