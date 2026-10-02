import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales. Every custom token and
 * utility from src/styles/tailwind.css that competes with a stock class is
 * registered here; without it `text-display-xl` would read as a text color
 * and be dropped next to `text-fg`. Keep this list in sync with the theme
 * (`src/lib/cn.test.ts` checks the important pairs).
 *
 * Colors need no entry: tailwind-merge treats any unknown `text-*`, `bg-*`
 * or `border-*` value as a color, so `bg-canvas` and `text-fg-muted` already
 * conflict with `bg-raised` and `text-fg`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-2xl",
        "display-xl",
        "display-lg",
        "display-fit",
        "display-md",
        "heading-lg",
        "heading-md",
        "heading-sm",
        "lead",
        "body",
        "small",
        "meta",
        "eyebrow",
        "label",
        "label-sm",
        "stat-sm",
        "stat-md",
        "stat-lg",
        "stat-xl",
      ],
      shadow: [
        "soft",
        "lift",
        "inset-hairline",
        "button",
        "button-hover",
        "button-inverse",
        "halo",
      ],
      radius: ["signature"],
      ease: ["brand", "snappy", "in-out-soft"],
      animate: ["rise", "rise-sm", "fade", "aurora", "drift", "pulse-ring"],
    },
    classGroups: {
      "fvn-spacing": ["tabular"],
      "scroll-mt": [{ "scroll-mt": ["header"] }],
    },
  },
});

/**
 * Joins class names (clsx) and resolves Tailwind conflicts (tailwind-merge
 * with the design-system tokens): when two classes set the same property, the
 * later one wins.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
