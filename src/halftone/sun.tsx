import type { CSSProperties, Ref } from "react";

/** Props of {@link Sun}. */
export type SunProps = {
  /** The root span, e.g. as the `sunRef` of a `HalftoneField`. */
  ref?: Ref<HTMLSpanElement>;
  /** Draw the soft glow behind the disc. Off where a clipping box would cut it. */
  glow?: boolean;
  /** Classes for the root; size and position it here or in `style`. */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
};

/**
 * The Makeathon sun, after the posters: a disc in the sun ramp that fades
 * toward the horizon, with a soft glow behind it. Absolutely positioned and
 * square; size and position come from the caller. Needs
 * `@tum.ai/ui-kit/halftone.css`. Decorative: hidden from assistive technology.
 */
export function Sun({ ref, glow = true, className, style }: SunProps) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={className ? `sun ${className}` : "sun"}
      style={style}
    >
      {glow ? <span className="sun-glow" /> : null}
      <span className="sun-disc" />
    </span>
  );
}
