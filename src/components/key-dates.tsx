import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";

/**
 * Where a date stands relative to today: `past` is struck through, `next`
 * is the one to act on (in the tone's accent, with its `note`), and
 * `upcoming` follows it.
 */
export type KeyDateState = "past" | "next" | "upcoming";

/** One row of {@link KeyDates}. */
export type KeyDateItem = {
  /** Stable key. */
  id: string;
  /** What happens on the date ("Application deadline"). */
  label: ReactNode;
  /** The date as shown, short ("27 Oct", "2 - 8 Nov"). */
  date: ReactNode;
  /** Machine-readable date for the `<time>` element (ISO 8601). */
  dateTime?: string;
  /** A line under the label, e.g. the closing time and timezone. */
  detail?: ReactNode;
  /** Default `upcoming`. The caller decides it from its own "now". */
  state?: KeyDateState;
  /** Shown beside a `next` date, e.g. "in 28 days". */
  note?: ReactNode;
};

const rowStyles = cva(
  "gap-x-6 grid grid-cols-[minmax(0,1fr)_auto] items-baseline border-b border-hairline",
  {
    variants: {
      /** `md` beside a headline; `lg` when the dates are the band's content. */
      size: { md: "py-4 md:py-5", lg: "py-6 md:py-8" },
    },
    defaultVariants: { size: "md" },
  },
);

const dateStyles = cva("relative inline-block text-right tabular", {
  variants: {
    size: { md: "text-stat-sm", lg: "text-stat-lg" },
    state: {
      past: "text-fg-subtle",
      next: "text-highlight",
      upcoming: "text-fg",
    },
  },
  defaultVariants: { size: "md", state: "upcoming" },
});

/** Props for {@link KeyDates}. */
export type KeyDatesProps = Omit<ComponentProps<"dl">, "children"> &
  Pick<VariantProps<typeof rowStyles>, "size"> & {
    /** The dates, in calendar order. */
    items: KeyDateItem[];
    /**
     * Draw the strikes through past dates once on load, in order. For a
     * register above the fold; further down the strikes are simply there.
     */
    drawIn?: boolean;
  };

/**
 * A register of important dates, as a conference's call for papers sets
 * them: one hairline row per date, the label on the left and the date in
 * large light figures on the right. Dates that have passed are struck
 * through (and say so to screen readers); the next one is in the tone's
 * accent with a note such as the days left. A definition list: each label
 * is the term for its date. It holds no clock: pass each row's `state`.
 */
export function KeyDates({ items, size, drawIn = false, className, ...props }: KeyDatesProps) {
  let pastIndex = 0;
  return (
    <dl className={cn("border-t border-hairline-strong", className)} {...props}>
      {items.map((item) => {
        const state = item.state ?? "upcoming";
        const strikeDelay = state === "past" ? 300 + pastIndex++ * 180 : 0;
        return (
          <div key={item.id} className={rowStyles({ size })}>
            <dt className="min-w-0">
              <span
                className={cn(
                  "font-medium block text-small",
                  state === "past" ? "text-fg-muted" : "text-fg",
                )}
              >
                {item.label}
              </span>
              {item.detail ? (
                <span className="mt-1 block text-meta text-fg-subtle">{item.detail}</span>
              ) : null}
            </dt>
            <dd className="gap-1.5 grid justify-items-end">
              <time dateTime={item.dateTime} className={dateStyles({ size, state })}>
                {item.date}
                {state === "past" ? (
                  <>
                    <span
                      aria-hidden="true"
                      data-strike=""
                      className={cn(
                        "absolute inset-x-[-0.08em] top-[55%] h-px origin-left bg-current",
                        drawIn && "motion-safe:animate-draw",
                      )}
                      style={drawIn ? { animationDelay: `${strikeDelay}ms` } : undefined}
                    />
                    <span className="sr-only"> (passed)</span>
                  </>
                ) : null}
              </time>
              {state === "next" && item.note ? (
                <span className="text-meta text-highlight">{item.note}</span>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
