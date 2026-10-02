import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { CountUp } from "./count-up";
import { textKey } from "./internal";

/** One figure of a {@link StatGrid}. */
export type StatItem = {
  /**
   * The figure. Numbers count up on scroll; strings render as they are
   * (e.g. "2020") unless `count` is set.
   */
  value: number | string;
  /**
   * Count a string figure such as "1.2M+" or "2,100+" up as well; it always
   * settles on the exact text. Default: true for numbers, false for strings.
   */
  count?: boolean;
  /** Text before a numeric value, e.g. "€". */
  prefix?: string;
  /** Text after a numeric value, e.g. "+". */
  suffix?: string;
  /** Fraction digits for numeric values (e.g. 2.3 → 1). */
  decimals?: number;
  /** Thousands separators for numeric values ("2,100"); default true. */
  grouping?: boolean;
  /** What the figure counts; also the list key, so keep it unique. */
  label: ReactNode;
  /** A short line under the label. */
  description?: ReactNode;
};

const statGridStyles = cva(
  "rounded-3xl grid gap-px overflow-hidden border border-hairline bg-hairline",
  {
    variants: {
      /** Columns on wide screens. */
      columns: {
        2: "grid-cols-2",
        3: "sm:grid-cols-3 grid-cols-1",
        4: "lg:grid-cols-4 grid-cols-2",
      },
    },
    defaultVariants: { columns: 4 },
  },
);

const cellStyles = cva("flex flex-col bg-canvas", {
  variants: {
    size: {
      sm: "gap-2 p-5",
      md: "gap-3 p-5 sm:p-6 md:p-7",
      lg: "gap-3 p-5 sm:p-6 md:p-8",
      xl: "gap-4 p-6 sm:p-7 md:p-9",
    },
  },
  defaultVariants: { size: "lg" },
});

const figureStyles = cva("order-1 text-fg", {
  variants: {
    /** Figure size, from the `text-stat-*` tokens. */
    size: {
      sm: "text-stat-sm",
      md: "text-stat-md",
      lg: "text-stat-lg",
      xl: "text-stat-xl",
    },
  },
  defaultVariants: { size: "lg" },
});

/** Props for {@link StatGrid}. */
export type StatGridProps = VariantProps<typeof statGridStyles> &
  VariantProps<typeof figureStyles> & {
    /** The figures, in reading order. */
    items: StatItem[];
    /** Classes merged over the `dl`. */
    className?: string;
  };

/**
 * One figure as text or a count-up. Shared with the Ledger (not exported from
 * the barrel).
 */
export function StatFigure({
  item,
}: {
  item: Pick<StatItem, "value" | "count" | "prefix" | "suffix" | "decimals" | "grouping">;
}) {
  const { value, prefix, suffix, decimals, grouping } = item;
  const count = item.count ?? typeof value === "number";
  if (!count) {
    return (
      <span className="tabular">
        {prefix}
        {value}
        {suffix}
      </span>
    );
  }
  if (typeof value === "string") {
    return <CountUp value={`${prefix ?? ""}${value}${suffix ?? ""}`} />;
  }
  return (
    <CountUp
      value={value}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      grouping={grouping}
    />
  );
}

/**
 * Row of large figures separated by hairlines (definition list semantics:
 * the label is the term, the figure its value).
 */
export function StatGrid({ items, columns, size, className }: StatGridProps) {
  return (
    <dl className={cn(statGridStyles({ columns }), className)}>
      {items.map((item) => (
        <div key={`${textKey(item.label, "stat")}:${item.value}`} className={cellStyles({ size })}>
          <dt className="font-medium order-2 text-small text-fg-muted">{item.label}</dt>
          <dd className={figureStyles({ size })}>
            <StatFigure item={item} />
          </dd>
          {item.description ? (
            <dd className="order-3 text-meta text-fg-subtle">{item.description}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
