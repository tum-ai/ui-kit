import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const topBlendStyles = cva(
  "inset-x-0 pointer-events-none absolute -z-[5] h-[clamp(9rem,24vh,15rem)]",
  {
    variants: {
      /** Which edge of the band blends into the root canvas. */
      // Literal classes (Tailwind only sees complete strings): brand black
      // fading out over a long, eased ramp.
      edge: {
        top: "top-0 bg-[linear-gradient(to_bottom,var(--color-black)_0%,color-mix(in_srgb,var(--color-black)_88%,transparent)_22%,color-mix(in_srgb,var(--color-black)_55%,transparent)_55%,color-mix(in_srgb,var(--color-black)_18%,transparent)_82%,transparent_100%)]",
        bottom:
          "bottom-0 bg-[linear-gradient(to_top,var(--color-black)_0%,color-mix(in_srgb,var(--color-black)_88%,transparent)_22%,color-mix(in_srgb,var(--color-black)_55%,transparent)_55%,color-mix(in_srgb,var(--color-black)_18%,transparent)_82%,transparent_100%)]",
      },
    },
    defaultVariants: { edge: "top" },
  },
);

/** Props for {@link TopBlend}. */
export type TopBlendProps = VariantProps<typeof topBlendStyles> & {
  /** Classes merged over the gradient layer. */
  className?: string;
};

/**
 * Eases the edge of a dark band into the flat root canvas color (brand black,
 * set by src/styles/shell.css). Safari paints its status bar and bottom toolbar from that
 * canvas at the page's ends, so without this the aurora and logomark of a
 * hero (top) or the footer (bottom) meet the browser chrome at a visible
 * seam. Place inside the band, after its decorative layers: it sits above
 * them (-z-[5]) and below the content. See docs/browser-quirks.md.
 */
export function TopBlend({ edge, className }: TopBlendProps) {
  return <div aria-hidden="true" className={cn(topBlendStyles({ edge }), className)} />;
}
