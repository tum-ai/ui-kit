"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, type PointerEvent, useCallback, useRef } from "react";

import { cn } from "../lib/cn";
import { useComposedRef } from "./refs";

/** Card surface of {@link SpotlightCard}. */
const cardStyles = cva("group/card rounded-3xl relative isolate text-fg", {
  variants: {
    /** Surface treatment. */
    variant: {
      /** Solid surface one step above the band. */
      raised: "border border-hairline bg-raised shadow-soft",
      /** Hairline only; for dense grids. */
      outline: "border border-hairline bg-transparent",
      /** Frosted panel for dark bands and imagery. */
      glass: "border-white/10 bg-white/[0.045] backdrop-blur-md border shadow-inset-hairline",
      /** No surface: layout and hover behavior only. */
      plain: "",
    },
    /** Inner padding step. */
    padding: {
      none: "",
      sm: "p-5",
      md: "p-6 md:p-7",
      lg: "p-7 md:p-9",
    },
    /** A 4px lift and a stronger shadow on hover (still under reduced motion). */
    interactive: {
      true: "hover:-translate-y-1 motion-reduce:hover:translate-y-0 transition-[translate,box-shadow,border-color,background-color] duration-500 ease-brand hover:border-hairline-strong hover:shadow-lift",
      false: "",
    },
  },
  defaultVariants: { variant: "raised", padding: "md", interactive: false },
});

/** Props for {@link SpotlightCard}: a div's props plus the card variants. */
export type SpotlightCardProps = ComponentProps<"div"> & VariantProps<typeof cardStyles>;

/**
 * Card with a soft light that follows the pointer and a glow that traces the
 * border under it. Mouse/pen only; touch and keyboard users see the plain card.
 * Styles live in `.spotlight-surface` (src/styles/index.css).
 */
export function SpotlightCard({
  variant,
  padding,
  interactive,
  className,
  onPointerMove,
  onPointerLeave,
  ref,
  ...props
}: SpotlightCardProps) {
  const own = useRef<HTMLDivElement>(null);
  const composedRef = useComposedRef(own, ref);
  const frame = useRef(0);

  const handleMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      if (event.pointerType === "touch") return;
      const node = own.current;
      if (!node) return;
      const { clientX, clientY } = event;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--spot-x", `${clientX - rect.left}px`);
        node.style.setProperty("--spot-y", `${clientY - rect.top}px`);
        node.style.setProperty("--spot-opacity", "1");
      });
    },
    [onPointerMove],
  );

  const handleLeave = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      cancelAnimationFrame(frame.current);
      own.current?.style.setProperty("--spot-opacity", "0");
    },
    [onPointerLeave],
  );

  return (
    <div
      ref={composedRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn(cardStyles({ variant, padding, interactive }), "spotlight-surface", className)}
      {...props}
    />
  );
}
