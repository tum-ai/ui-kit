import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Anchor } from "./anchor";

/**
 * Button styles, shared by <Button> (actions) and <ButtonLink> (navigation).
 * Exported for the rare element that must look like a button but cannot be
 * one of the two (e.g. a link with its own accessible-name wiring).
 *
 * Primary uses violet-600 (#8052C2) at rest so white labels meet WCAG AA
 * (5.4:1), and the brand's dark purple (#523573) on hover: a flat, exact
 * fill with a hairline highlight, no glow or sheen. Secondary, outline
 * and ghost read the surrounding tone, so they work on light and dark bands.
 */
export const buttonStyles = cva(
  [
    "group/button gap-2 relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden",
    "font-semibold rounded-full tracking-[-0.01em] whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,box-shadow,scale] duration-hover ease-brand",
    "disabled:pointer-events-none disabled:opacity-45 motion-safe:active:scale-[0.98]",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:shrink-0",
  ],
  {
    variants: {
      /** Visual weight. `inverse` is solid white for dark bands and photos. */
      variant: {
        primary:
          "text-white bg-violet-600 shadow-button hover:bg-violet-800 hover:shadow-button-hover",
        secondary: "bg-fg/[0.07] text-fg hover:bg-fg/[0.12]",
        outline: "border border-fg/25 text-fg hover:border-fg/60 hover:bg-fg/[0.04]",
        ghost: "text-fg hover:bg-fg/[0.07]",
        inverse: "bg-white text-violet-950 shadow-button-inverse hover:bg-violet-50",
        link: "px-0 h-auto rounded-none text-highlight decoration-1 underline-offset-[6px] hover:underline",
      },
      /** Height step; `icon` and `icon-sm` are square. */
      size: {
        // 13px without text-meta's line height, so text-height links keep their box.
        sm: "h-9 px-4 text-label-sm",
        md: "h-11 px-5.5 text-label",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    compoundVariants: [
      // Text-height links get a finger-sized hit area; the negative margin
      // keeps their layout box unchanged.
      { variant: "link", className: "-my-3 px-0 py-3 h-auto" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/** The variant props every button-styled component shares. */
export type ButtonStyleProps = VariantProps<typeof buttonStyles>;

/**
 * Trailing arrow: `true` or `"right"` points on, `"external"` up and out,
 * `"down"` to a section below.
 */
export type ButtonArrowKind = boolean | "right" | "external" | "down";

function ButtonArrow({ kind }: { kind: Exclude<ButtonArrowKind, false> }) {
  const base =
    "size-4 transition-transform duration-surface ease-brand motion-reduce:transition-none";
  if (kind === "external") {
    return (
      <ArrowUpRight
        aria-hidden
        className={cn(
          base,
          "group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5",
        )}
      />
    );
  }
  if (kind === "down") {
    return <ArrowDown aria-hidden className={cn(base, "group-hover/button:translate-y-0.5")} />;
  }
  return <ArrowRight aria-hidden className={cn(base, "group-hover/button:translate-x-1")} />;
}

/** Props for {@link Button}: Base UI's button props plus the style variants. */
export type ButtonProps = Omit<BaseButton.Props, "className"> &
  ButtonStyleProps & {
    /** Trailing arrow that nudges on hover. */
    arrow?: ButtonArrowKind;
    /** Classes merged over the variant styles. */
    className?: string;
  };

/**
 * Action button (Base UI): keyboard, focus and disabled semantics come from
 * the primitive. Pass `focusableWhenDisabled` to keep a disabled button in
 * the tab order (it is then `aria-disabled`). For navigation use
 * <ButtonLink>.
 */
export function Button({ variant, size, arrow, className, children, ...props }: ButtonProps) {
  return (
    <BaseButton className={cn(buttonStyles({ variant, size }), className)} {...props}>
      {children}
      {arrow ? <ButtonArrow kind={arrow} /> : null}
    </BaseButton>
  );
}

/** Props for {@link ButtonLink}. */
export type ButtonLinkProps = Omit<ComponentProps<"a">, "href"> &
  ButtonStyleProps & {
    /** Route, in-page anchor, http(s), mailto: or tel: URL. */
    href: string;
    /** Trailing arrow that nudges on hover. */
    arrow?: ButtonArrowKind;
    /** Force new-tab behavior; defaults to true for http(s) URLs. */
    external?: boolean;
    /** The visible label. */
    children: ReactNode;
  };

/**
 * Link styled as a button. It links through <Anchor>: internal routes use
 * next/link; external links open in a new tab with `rel="noopener noreferrer"`
 * and an announced hint.
 */
export function ButtonLink({
  href,
  variant,
  size,
  arrow,
  external,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Anchor
      href={href}
      external={external}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {children}
      {arrow ? <ButtonArrow kind={arrow} /> : null}
    </Anchor>
  );
}

/** Props for {@link IconButton}. */
export type IconButtonProps = Omit<ButtonProps, "arrow" | "size"> & {
  /** Required: the only name an icon-only button has. */
  "aria-label": string;
  /** Square size step. Default `icon`. */
  size?: "icon" | "icon-sm";
};

/** Icon-only action. An accessible label is required. */
export function IconButton({ size = "icon", variant = "secondary", ...props }: IconButtonProps) {
  return <Button size={size} variant={variant} {...props} />;
}
