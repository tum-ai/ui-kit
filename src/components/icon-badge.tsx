import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

const iconBadgeStyles = cva("inline-grid shrink-0 place-items-center text-highlight", {
  variants: {
    /** Surface behind the icon. */
    variant: {
      /** Violet tint with an inset ring (feature cards, finder options). */
      tint: "bg-violet-500/12 ring-1 ring-violet-500/20 ring-inset",
      /** Neutral wash that follows the band tone (empty states). */
      soft: "bg-fg/[0.06]",
      /** Hairline ring only (step markers, dense lists). */
      outline: "border border-hairline-strong bg-canvas",
    },
    /** Box size; the icon scales with it. */
    size: {
      sm: "size-8 [&_svg]:size-4",
      md: "size-12 [&_svg]:size-5",
      lg: "size-14 [&_svg]:size-6",
    },
    /** `square` has rounded corners, `circle` is round. */
    shape: {
      square: "",
      circle: "rounded-full",
    },
    /**
     * Tilts and fills with brand violet while the enclosing card
     * (`group/card`), link or button is hovered (the `card-hover:` variant;
     * no tilt under reduced motion).
     */
    interactive: {
      true: [
        "transition-[background-color,color,rotate] duration-500 ease-brand motion-reduce:transition-none",
        "card-hover:text-white card-hover:bg-violet-600 motion-safe:card-hover:-rotate-6",
      ],
      false: "",
    },
  },
  compoundVariants: [
    { shape: "square", size: "sm", className: "rounded-lg" },
    { shape: "square", size: "md", className: "rounded-2xl" },
    { shape: "square", size: "lg", className: "rounded-2xl" },
  ],
  defaultVariants: {
    variant: "tint",
    size: "md",
    shape: "square",
    interactive: false,
  },
});

/** Props for {@link IconBadge}. */
export type IconBadgeProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof iconBadgeStyles> & {
    /** The Lucide icon. It is decorative; name the thing in adjacent text. */
    icon: LucideIcon;
    /** Stroke width of the icon. Default 1.75, the house weight. */
    strokeWidth?: number;
  };

/**
 * An icon in a tinted tile, always in the brand violet (never per-item accent
 * colors). Decorative: the icon is hidden from assistive tech.
 */
export function IconBadge({
  icon: Icon,
  variant,
  size,
  shape,
  interactive,
  strokeWidth = 1.75,
  className,
  ...props
}: IconBadgeProps) {
  return (
    <span
      className={cn(iconBadgeStyles({ variant, size, shape, interactive }), className)}
      {...props}
    >
      <Icon aria-hidden="true" strokeWidth={strokeWidth} />
    </span>
  );
}
