import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

const rulerStyles = cva("relative", {
  variants: {
    /** Tick heights: `md` under a register, `lg` when the ruler carries a band. */
    size: { md: "h-5", lg: "h-8 md:h-10" },
  },
  defaultVariants: { size: "md" },
});

const markLabelStyles = cva("mb-3 relative text-highlight", {
  variants: {
    size: { md: "h-[1.45em] text-meta", lg: "h-[1.3em] text-heading-md" },
  },
  defaultVariants: { size: "md" },
});

const tickStyles = cva("bottom-0 absolute w-px -translate-x-1/2", {
  variants: {
    /** Every seventh day from the start is a week tick, drawn taller. */
    week: { true: "h-full", false: "h-1/2" },
    elapsed: { true: "bg-highlight", false: "bg-hairline-strong" },
  },
});

/** Props for {@link DayRuler}. */
export type DayRulerProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof rulerStyles> & {
    /** Days the ruler spans: it draws `days + 1` ticks, one per midnight. */
    days: number;
    /** Whole days gone, `0..days`: the fill runs to this tick and the mark sits on it. */
    elapsed: number;
    /** Label under the first tick (e.g. "Opened 28 Sep"). */
    startLabel?: ReactNode;
    /** Label under the last tick (e.g. "Deadline 27 Oct"). */
    endLabel?: ReactNode;
    /**
     * Label over today's mark (e.g. "Today", "26 days left"). It sits
     * centred on the mark, and flush with the ruler's end near either edge.
     */
    markLabel?: ReactNode;
    /** Draw the fill once on load, for a ruler above the fold. */
    drawIn?: boolean;
  };

/**
 * A window of days as a ruler: one tick per day, taller ticks every week,
 * and a fill from the first tick to today's with a mark on it, so how much
 * of the window is gone reads at a glance. Built from whole days, not
 * eyeballed. Decorative (`aria-hidden`): state the same fact in text beside
 * it, such as "27 days left".
 */
/**
 * Share of the ruler at each end where the mark label pins to that edge instead
 * of centring on the mark, so a label near the first or last day never overflows
 * the ruler.
 */
const LABEL_EDGE = 0.15;

export function DayRuler({
  days,
  elapsed,
  startLabel,
  endLabel,
  markLabel,
  size,
  drawIn = false,
  className,
  ...props
}: DayRulerProps) {
  const span = Math.max(days, 1);
  const done = Math.min(Math.max(elapsed, 0), span);
  const at = (day: number) => `${(day / span) * 100}%`;
  const ticks = Array.from({ length: span + 1 }, (_, day) => day);
  const share = done / span;
  return (
    <div aria-hidden="true" className={className} {...props}>
      {markLabel ? (
        <div className={markLabelStyles({ size })}>
          <span
            data-mark-label=""
            className={cn(
              "top-0 absolute whitespace-nowrap",
              share >= LABEL_EDGE && share <= 1 - LABEL_EDGE && "-translate-x-1/2",
              drawIn && "[animation-delay:900ms] motion-safe:animate-fade",
            )}
            style={
              share < LABEL_EDGE
                ? { left: 0 }
                : share > 1 - LABEL_EDGE
                  ? { right: 0 }
                  : { left: at(done) }
            }
          >
            {markLabel}
          </span>
        </div>
      ) : null}
      <div className={rulerStyles({ size })}>
        {ticks.map((day) => (
          <span
            key={day}
            className={tickStyles({
              week: day % 7 === 0 || day === span,
              elapsed: day <= done,
            })}
            style={{ left: at(day) }}
          />
        ))}
        <span className="inset-x-0 bottom-0 absolute h-px bg-hairline-strong" />
        <span
          data-fill=""
          className={cn(
            "bottom-0 left-0 h-0.5 absolute origin-left bg-highlight",
            drawIn && "motion-safe:animate-draw",
          )}
          style={{ width: at(done) }}
        />
        <span
          data-today=""
          className={cn(
            "bottom-0 size-2.5 absolute -translate-x-1/2 translate-y-1/2 rounded-full bg-highlight ring-4 ring-canvas",
            drawIn && "[animation-delay:900ms] motion-safe:animate-fade",
          )}
          style={{ left: at(done) }}
        />
      </div>
      {startLabel || endLabel ? (
        <div className="mt-3 gap-6 flex justify-between text-meta text-fg-subtle">
          <span>{startLabel}</span>
          <span className="text-right">{endLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
