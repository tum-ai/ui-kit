import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { BrandMark } from "./brand-mark";

/*
 * Three compositions, so neighbouring panels don't look copy-pasted. Only the
 * position of the light and the mark changes; the colors stay in the brand
 * violets.
 */
const glowStyles = cva("inset-0 absolute -z-10", {
  variants: {
    composition: {
      0: "bg-[radial-gradient(95%_75%_at_12%_8%,--alpha(var(--color-violet-500)/55%),transparent_62%)]",
      1: "bg-[radial-gradient(90%_70%_at_92%_14%,--alpha(var(--color-violet-500)/50%),transparent_62%)]",
      2: "bg-[radial-gradient(110%_80%_at_50%_104%,--alpha(var(--color-violet-500)/50%),transparent_62%)]",
    },
  },
});

const markStyles = cva("absolute -z-10 zoom-media", {
  variants: {
    composition: {
      0: "-right-[30%] -bottom-[16%] w-[112%]",
      1: "-bottom-[20%] -left-[34%] w-[118%]",
      2: "-top-[14%] -right-[18%] w-[96%] rotate-180",
    },
  },
});

const compositions = 3;

/** Props for {@link BrandPanel}. */
export type BrandPanelProps = Omit<ComponentProps<"div">, "aria-hidden"> & {
  /**
   * Picks one of three compositions, e.g. the item's index in a grid, so
   * neighbours differ. Any integer works.
   */
  seed?: number;
};

/**
 * On-brand stand-in for a missing or broken photo: an ink panel with violet
 * light, the logomark as a cropped tonal shape (as on the brand guide's
 * slides) and film grain. It fills its positioned parent and is decorative,
 * so it is hidden from assistive tech; `children` can add typographic art
 * (e.g. a collaborator name) that is also shown as text elsewhere. The mark
 * joins the card's hover zoom (`group/zoom`).
 */
export function BrandPanel({ seed = 0, className, children, ...props }: BrandPanelProps) {
  const composition = (((seed % compositions) + compositions) % compositions) as 0 | 1 | 2;
  return (
    <div
      aria-hidden="true"
      data-tone="ink"
      className={cn("inset-0 absolute isolate overflow-hidden", className)}
      {...props}
    >
      <div className={glowStyles({ composition })} />
      <BrandMark drift={false} intensity="medium" className={markStyles({ composition })} />
      <div className="grain -z-10" />
      {children}
    </div>
  );
}
