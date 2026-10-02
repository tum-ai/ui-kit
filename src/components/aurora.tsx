import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const auroraStyles = cva("inset-0 pointer-events-none absolute -z-10 overflow-hidden", {
  variants: {
    /** How strongly the light shows. */
    intensity: {
      subtle: "opacity-50",
      default: "opacity-80",
      vivid: "opacity-100",
    },
  },
  defaultVariants: { intensity: "default" },
});

/** Props for {@link Aurora}. */
export type AuroraProps = VariantProps<typeof auroraStyles> & {
  /** Classes merged over the light field's box (fills its parent). */
  className?: string;
};

/**
 * Slow-moving light field for dark bands: three soft radial glows in the brand
 * violets drifting on long, offset loops. Transform-only (compositor friendly)
 * and static under reduced motion. Place inside a `relative isolate` parent.
 */
export function Aurora({ className, intensity }: AuroraProps) {
  return (
    <div aria-hidden className={cn(auroraStyles({ intensity }), className)}>
      <div className="absolute -top-[35%] -left-[20%] h-[95%] w-[75%] rounded-full bg-[radial-gradient(closest-side,--alpha(var(--color-violet-500)/42%),transparent)] motion-safe:animate-aurora" />
      <div className="absolute top-[5%] -right-[18%] h-[85%] w-[65%] rounded-full bg-[radial-gradient(closest-side,--alpha(var(--color-violet-800)/75%),transparent)] [animation-delay:-11s] [animation-direction:alternate-reverse] motion-safe:animate-aurora" />
      <div className="absolute -bottom-[45%] left-[22%] h-[80%] w-[60%] rounded-full bg-[radial-gradient(closest-side,--alpha(var(--color-violet-300)/20%),transparent)] [animation-delay:-19s] motion-safe:animate-aurora" />
    </div>
  );
}
