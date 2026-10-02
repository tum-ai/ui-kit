import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, useId } from "react";

import { cn } from "../lib/cn";

const brandMarkStyles = cva("pointer-events-none select-none", {
  variants: {
    drift: {
      true: "motion-safe:animate-drift",
      false: "",
    },
    /**
     * White at a low opacity, for dark bands: `faint` 3% (footer, quiet
     * teasers), `subtle` 3.5% (heroes, menus, full-bleed CTAs), `soft` 4%
     * (inset panels), `medium` 7% (photo stand-ins), `strong` 10% (the violet
     * band). Leave it unset to color the mark with a text color instead.
     */
    intensity: {
      faint: "text-white/[0.03]",
      subtle: "text-white/[0.035]",
      soft: "text-white/[0.04]",
      medium: "text-white/[0.07]",
      strong: "text-white/[0.1]",
    },
  },
  defaultVariants: { drift: true },
});

/** Props for {@link BrandMark}. */
export type BrandMarkProps = Omit<ComponentProps<"svg">, "children" | "viewBox" | "fill"> & {
  /** `tonal`: one currentColor fill. `gradient`: violet fade on the center stroke. */
  variant?: "tonal" | "gradient";
  /** Slow ambient drift (still under reduced motion). Default true. */
  drift?: boolean;
  /** How much the white mark shows on a dark band; see the cva variant. */
  intensity?: VariantProps<typeof brandMarkStyles>["intensity"];
};

/**
 * The official TUM.ai logomark geometry (the outline of
 * public/assets/tum_ai_logo_new.svg; the gradient variant keeps the inner
 * leg as its own path, as the official gradient logo does), used as a large tonal background shape
 * exactly as the 2026 brand guide does on its section slides. It is
 * decoration only (hidden from assistive technology): never recolor it into
 * a logo substitute or place it where the real logo belongs. Size and place
 * it with `className`; set `intensity` on dark bands, or color it with a text
 * color.
 */
export function BrandMark({
  className,
  variant = "tonal",
  drift,
  intensity,
  ...props
}: BrandMarkProps) {
  // Unique per instance: a shared id breaks when the first instance is hidden.
  const gradientId = `brand-mark-fade-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 477 406"
      className={cn(brandMarkStyles({ drift, intensity }), className)}
      fill="currentColor"
      {...props}
    >
      {variant === "gradient" ? (
        <defs>
          {/* The official logo's gradient stops. */}
          <linearGradient
            id={gradientId}
            x1="153.72"
            y1="180.59"
            x2="448.91"
            y2="291.39"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset=".05" stopColor="#3D2175" />
            <stop offset=".35" stopColor="#9B6BEA" />
            <stop offset="1" stopColor="#AC78FF" />
          </linearGradient>
        </defs>
      ) : null}
      {variant === "gradient" ? (
        <>
          <path
            fill={`url(#${gradientId})`}
            d="M353.29 366.1c0 3.49-.45 6.88-1.29 10.11-.9 3.45-2.25 6.72-3.99 9.74v.02c-6.32 10.97-17.7 18.65-30.95 19.84-.6.06-1.2.1-1.81.13h-3.64c-.61-.03-1.21-.07-1.81-.13-13.06-1.18-24.3-8.65-30.67-19.36l-4.3-10.31-65.72-157.63-5.89-14.12c-6.08-8.47-15.94-13.99-27.09-13.99s-21.12 5.56-27.18 14.11l26.94-65.68 26.29-64.08 14.72-35.89.97-2.37 128.39 306.98 6.35 15.19c.45 2.41.69 4.9.69 7.44Z"
          />
          <path d="M217.86 36.49l-.97 2.37-14.72 35.89-26.29 64.08-26.94 65.68-5.85 14.25-64.64 157.58-3.99 9.74-.01.02c-6.32 10.97-17.7 18.65-30.95 19.84h-7.26C15.92 404.11 0 387.03 0 366.23c0-4.28.68-8.41 1.93-12.28l2.32-5.64L132.85 35.65l3.46-8.4.81-1.96c.26-.62.55-1.23.85-1.83C144.84 9.67 158.97.21 175.28.21c14.13 0 26.61 7.1 34.17 17.96.08.1.15.2.21.3.73 1.07 1.41 2.17 2.04 3.3 1.5 2.69 2.71 5.57 3.6 8.59l2.56 6.13Z" />
          <path d="M476.36 365.87c0 3.49-.45 6.88-1.29 10.11-.9 3.45-2.25 6.72-3.99 9.74l-.01.02c-6.32 10.97-17.7 18.65-30.95 19.84-.6.06-1.2.1-1.81.13h-3.64c-.61-.03-1.21-.07-1.81-.13-13.06-1.18-24.3-8.65-30.67-19.36l-4.3-10.31L266.92 61.79l-5.71-13.68c-.56-2.66-.85-5.41-.85-8.24 0-4.28.68-8.41 1.93-12.28.63-1.95 1.4-3.83 2.32-5.64C271.17 8.93 284.66 0 300.23 0c13.49 0 25.41 6.7 32.63 16.96l6.61 15.8 129.85 310.48 6.35 15.19c.45 2.41.69 4.9.69 7.44Z" />
        </>
      ) : (
        // One outline for the single-colour mark: separate pieces that meet
        // edge to edge leave an antialiased hairline along the seam.
        <path d="M352.19,376.26Q350.85,381.4 348.21,386.00L348.21,386.02L348.18,386.07Q343.35,394.45 335.24,399.73Q326.94,405.12 317.08,406.01Q316.27,406.09 315.26,406.14L315.25,406.14L311.61,406.14L311.6,406.14Q310.59,406.09 309.78,406.01Q300.06,405.13 291.85,399.87Q283.83,394.74 278.96,386.55L278.95,386.54L274.65,376.22L208.93,218.59L203.04,204.49Q199.02,198.89 193.86,195.55C192.32,194.57 190.69,193.71 188.99,192.99Q183.16,190.6 176.13,190.60Q169.73,190.6 164.33,192.57C161.84,193.52 159.49,194.76 157.33,196.25Q152.74,199.5 149.11,204.63L149.11,204.62L143.28,218.84L78.64,376.42L74.65,386.14L74.65,386.15L74.64,386.18L74.63,386.19L74.62,386.20L74.62,386.20Q69.79,394.58 61.68,399.86Q53.38,405.25 43.52,406.14L43.51,406.14L36.23,406.14L36.22,406.14Q20.84,404.75 10.35,393.33Q-0.2,381.84 -0.2,366.23Q-0.2,359.89 1.74,353.89L1.74,353.88L4.07,348.23L132.67,35.57L136.12,27.18L136.13,27.17Q136.58,25.97 136.93,25.21L136.94,25.21L136.94,25.21Q137.28,24.39 137.79,23.37Q143.05,12.8 152.98,6.49Q163.18,0.01 175.28,0.01Q185.74,0.01 194.92,4.94Q203.8,9.71 209.61,18.05Q209.73,18.21 209.83,18.36Q210.93,19.97 211.87,21.67Q214.15,25.75 215.49,30.29L217.86,35.98L217.87,35.97L346.44,343.39L352.8,358.60L352.81,358.62Q353.5,362.34 353.5,366.10L353.5,366.30L353.49,366.30Q353.46,371.37 352.19,376.26ZM476.56,365.87Q476.56,371.05 475.26,376.03Q473.92,381.19 471.26,385.81L471.25,385.83L471.24,385.84Q466.41,394.22 458.3,399.50Q450,404.89 440.14,405.78Q439.33,405.86 438.32,405.91L438.31,405.91L434.67,405.91L434.66,405.91Q433.65,405.86 432.84,405.78Q423.12,404.9 414.91,399.64Q406.89,394.51 402.02,386.32L402.01,386.31L397.71,375.99L266.74,61.87L261.02,48.17L261.01,48.15Q260.16,44.09 260.16,39.87Q260.16,33.53 262.1,27.53Q263.06,24.56 264.43,21.86Q269.46,11.88 278.93,5.92Q288.67,-0.2 300.23,-0.20Q310.22,-0.2 318.99,4.46Q327.48,8.96 333.02,16.84L333.04,16.86L339.65,32.68L469.5,343.16L475.86,358.37L475.87,358.39Q476.56,362.11 476.56,365.87Z" />
      )}
    </svg>
  );
}
