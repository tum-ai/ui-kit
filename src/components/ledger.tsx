import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { textKey } from "./internal";
import { StatFigure, type StatItem } from "./stat";

/** One row of a {@link Ledger}. */
export type LedgerItem = Pick<
  StatItem,
  "value" | "count" | "prefix" | "suffix" | "decimals" | "grouping"
> & {
  /** What the figure counts; also the row key, so keep it unique. */
  label: ReactNode;
  /** One short line of context under the label, e.g. where a number comes from. */
  note?: ReactNode;
};

const ledgerStyles = cva("border-t border-hairline-strong", {
  variants: {
    /**
     * Figure size: `md` (the stat-md step) for a ledger beside a headline,
     * `lg` (stat-lg) when the ledger is the section's main content.
     */
    size: {
      md: "",
      lg: "",
    },
  },
  defaultVariants: { size: "md" },
});

const figureStyles = cva("text-right text-fg tabular", {
  variants: {
    size: {
      md: "text-stat-md",
      lg: "text-stat-lg",
    },
  },
  defaultVariants: { size: "md" },
});

/** Props for {@link Ledger}. */
export type LedgerProps = VariantProps<typeof ledgerStyles> & {
  /** The rows, in reading order. */
  items: LedgerItem[];
  /** Classes merged over the `dl`. */
  className?: string;
};

/**
 * Key figures as an annual-report ledger: one hairline row per figure, the
 * label and its note on the left, the figure set large and right-aligned.
 * A definition list, so each label is the term for its figure. Numbers count
 * up once when they scroll into view (see StatGrid); strings render as given.
 */
export function Ledger({ items, size, className }: LedgerProps) {
  return (
    <dl className={cn(ledgerStyles({ size }), className)}>
      {items.map((item) => (
        <div
          key={`${textKey(item.label, "row")}:${item.value}`}
          className="gap-x-6 gap-y-1 py-5 md:py-6 grid grid-cols-[minmax(0,1fr)_auto] items-end border-b border-hairline"
        >
          <dt className="font-medium text-small text-fg">{item.label}</dt>
          <dd className={cn(figureStyles({ size }), item.note && "row-span-2")}>
            <StatFigure item={item} />
          </dd>
          {item.note ? <dd className="col-start-1 text-meta text-fg-muted">{item.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
