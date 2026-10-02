import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

const actionsStyles = cva("gap-3 flex w-fit max-w-full flex-wrap items-center *:grow", {
  variants: {
    /** Horizontal alignment of the row. */
    align: {
      start: "",
      center: "mx-auto justify-center",
    },
  },
  defaultVariants: { align: "start" },
});

/** Props for {@link Actions}. */
export type ActionsProps = ComponentProps<"div"> & VariantProps<typeof actionsStyles>;

/**
 * A row of buttons and status badges. On one line every item keeps its
 * natural width. Once the row wraps (phones), it spans the available width
 * and every item grows to fill its line, so stacked actions share one width.
 * Use it for every group of two or more actions.
 */
export function Actions({ align, className, ...props }: ActionsProps) {
  return <div className={cn(actionsStyles({ align }), className)} {...props} />;
}
