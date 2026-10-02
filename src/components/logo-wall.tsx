import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Anchor } from "./anchor";
import { FallbackImage } from "./fallback-image";
import { isUnoptimizedRemoteImage } from "./internal";

/** One organization in a {@link LogoWall} or {@link LogoTile}. */
export type LogoItem = {
  /** Organization name: the fallback text and the default `alt`. */
  name: string;
  /** Logo artwork. Without it (or if it fails to load) the name is set instead. */
  src?: string;
  /** Link to the organization; http(s) URLs open in a new tab. */
  href?: string;
  /** Text alternative for the artwork. Default `name`. */
  alt?: string;
  /**
   * Name set beside a symbol-only logo, forming a wordmark lockup
   * ("[symbol] Y Combinator"). The image then gets an empty `alt`, since the
   * text names the organization.
   */
  wordmark?: ReactNode;
  /**
   * Serve the artwork as is, skipping the image optimizer. Default: true for
   * absolute http(s) URLs, false for local assets. Set false to optimize
   * remote artwork and configure the consumer app's `images.remotePatterns`.
   */
  unoptimized?: boolean;
  /**
   * The artwork's width divided by its height. A `strip` wall uses it to
   * give every logo the same area, so wide wordmarks and square marks read
   * at one visual weight.
   */
  aspectRatio?: number;
};

const logoTileStyles = cva("group/logo inline-flex items-center justify-center", {
  variants: {
    /**
     * `tile`: a white card for logo grids. `chip`: a compact white chip
     * that carries light-background artwork on dark bands (quote rows,
     * meta lines). `bare`: no surface, for artwork made for dark bands
     * (logo rails on ink); size it with `className`. `mono`: no surface,
     * light-background artwork in greyscale on light bands, in colour
     * while hovered or focused; it fills its parent's `--logo-w` and
     * `--logo-h` (a `strip` wall sets them).
     */
    variant: {
      tile: "rounded-2xl bg-white w-full text-violet-950 ring-1 ring-ink-200/70",
      chip: "h-9 gap-2 bg-white px-3 rounded-xl text-violet-950",
      bare: "text-fg",
      // The dimming sits on the artwork and the name, not here: opacity
      // on the tile would isolate the artwork's multiply blend and bring
      // back its white matte.
      mono: "h-(--logo-h,2.5rem) w-(--logo-w,7rem) text-fg",
    },
    /**
     * Tile height and logo cap (the `tile` variant only), smallest to
     * largest: `sm` 64px, `md` 96px, `lg` 112px, `xl` 128px.
     */
    size: {
      sm: "",
      md: "",
      lg: "",
      xl: "",
    },
    /**
     * One size step smaller below `md` (phones and small tablets), for
     * `lg` and `xl` tiles in narrow grid cells.
     */
    responsive: {
      true: "",
      false: "",
    },
    /**
     * Chip only: a fixed width (6.25rem, 7.75rem from `sm`) that reserves the
     * artwork's box, so a wrapping row of chips doesn't reflow while the
     * logos load.
     */
    fixed: {
      true: "",
      false: "",
    },
    /** Hover tint and violet ring on white tiles and chips that link. */
    linked: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { variant: "tile", size: "sm", className: "h-16 px-5" },
    { variant: "tile", size: "md", className: "h-24 px-6" },
    { variant: "tile", size: "lg", className: "h-28 px-7" },
    { variant: "tile", size: "xl", className: "h-32 px-8" },
    {
      variant: "tile",
      size: "lg",
      responsive: true,
      className: "max-md:h-24 max-md:px-6",
    },
    {
      variant: "tile",
      size: "xl",
      responsive: true,
      className: "max-md:h-28 max-md:px-7",
    },
    { variant: "chip", fixed: true, className: "w-25 sm:w-31" },
    {
      variant: ["tile", "chip"],
      linked: true,
      className:
        "transition-[background-color,box-shadow] duration-hover ease-brand hover:bg-violet-50 hover:ring-2 hover:ring-violet-500 focus-visible:bg-violet-50 motion-reduce:transition-none",
    },
  ],
  defaultVariants: {
    variant: "tile",
    size: "md",
    responsive: false,
    fixed: false,
    linked: false,
  },
});

const logoImageStyles = cva("h-auto w-auto max-w-full object-contain", {
  variants: {
    variant: {
      // Multiply drops the white matte of light-background artwork.
      tile: "mix-blend-multiply",
      chip: "h-5 max-w-28 mix-blend-multiply",
      bare: "",
      // Multiply drops the white matte; the colour returns with the link's
      // hover or focus (a swap, not a transition: only opacity animates).
      mono: "size-full opacity-75 mix-blend-multiply grayscale transition-opacity duration-hover ease-brand group-hover/logo:opacity-100 group-hover/logo:grayscale-0 group-focus-visible/logo:opacity-100 group-focus-visible/logo:grayscale-0 motion-reduce:transition-none",
    },
    size: { sm: "", md: "", lg: "", xl: "" },
    responsive: { true: "", false: "" },
    lockup: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: "tile", size: "sm", lockup: false, className: "max-h-7" },
    { variant: "tile", size: "md", lockup: false, className: "max-h-10" },
    { variant: "tile", size: "lg", lockup: false, className: "max-h-12" },
    { variant: "tile", size: "xl", lockup: false, className: "max-h-14" },
    {
      variant: "tile",
      size: "lg",
      responsive: true,
      lockup: false,
      className: "max-md:max-h-10",
    },
    {
      variant: "tile",
      size: "xl",
      responsive: true,
      lockup: false,
      className: "max-md:max-h-12",
    },
    { variant: ["tile", "bare"], lockup: true, className: "size-9" },
    {
      variant: "bare",
      lockup: false,
      className: "max-h-8 md:max-h-10 h-full w-full",
    },
  ],
});

const logoNameStyles = cva("font-semibold", {
  variants: {
    variant: {
      tile: "",
      chip: "text-label-sm tracking-[-0.01em]",
      bare: "",
      mono: "text-center text-label opacity-75 transition-opacity duration-hover ease-brand group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100 motion-reduce:transition-none",
    },
    lockup: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: ["tile", "bare"], lockup: true, className: "text-label" },
    {
      variant: ["tile", "bare"],
      lockup: false,
      className: "text-center text-heading-sm",
    },
  ],
});

/** Props for {@link LogoTile}. */
export type LogoTileProps = Omit<LogoItem, "aspectRatio"> &
  Omit<VariantProps<typeof logoTileStyles>, "linked"> & {
    /** Load the artwork eagerly, e.g. inside a moving marquee. */
    eager?: boolean;
    /** Classes merged over the tile. */
    className?: string;
  };

/**
 * An organization's logo: on white by default (most logos are designed for
 * light backgrounds), or `bare` for artwork made for dark bands. With `href`
 * the whole tile is a link: external links open in a new tab and say so.
 * Falls back to the name when there is no artwork or it fails to load;
 * `wordmark` sets a name beside symbol-only artwork.
 */
export function LogoTile({
  name,
  src,
  href,
  alt,
  wordmark,
  unoptimized,
  variant = "tile",
  size = "md",
  responsive = false,
  fixed = false,
  eager = false,
  className,
}: LogoTileProps) {
  const lockup = wordmark !== undefined;
  const nameText = <span className={logoNameStyles({ variant, lockup })}>{wordmark ?? name}</span>;
  const content = (
    <>
      <FallbackImage
        src={src}
        alt={lockup ? "" : (alt ?? name)}
        width={200}
        height={80}
        unoptimized={unoptimized ?? (src ? isUnoptimizedRemoteImage(src) : false)}
        loading={eager ? "eager" : "lazy"}
        className={cn(logoImageStyles({ variant, size, responsive, lockup }))}
        fallback={lockup ? null : nameText}
      />
      {lockup ? nameText : null}
    </>
  );
  const classes = cn(
    logoTileStyles({ variant, size, responsive, fixed, linked: Boolean(href) }),
    lockup && "gap-2.5",
    className,
  );

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Anchor href={href} className={classes}>
      {content}
    </Anchor>
  );
}

const logoWallStyles = cva("", {
  variants: {
    /**
     * `grid`: white tiles in columns. `strip`: `mono` logos in one wrapping
     * row, each sized to the same area from its `aspectRatio`.
     */
    layout: {
      grid: "gap-3 grid",
      strip: "gap-x-12 gap-y-10 md:gap-x-16 flex flex-wrap items-center",
    },
    /** Columns on wide screens (`grid` only); phones always show two. */
    columns: {
      3: "sm:grid-cols-3 grid-cols-2",
      4: "sm:grid-cols-3 lg:grid-cols-4 grid-cols-2",
      5: "sm:grid-cols-3 lg:grid-cols-5 grid-cols-2",
      6: "sm:grid-cols-3 lg:grid-cols-6 grid-cols-2",
    },
  },
  defaultVariants: { layout: "grid", columns: 4 },
});

/** The area every `strip` logo gets, in rem² (a 7rem × 1.75rem wordmark). */
const STRIP_LOGO_AREA = 12.25;
/* Aspect ratios outside this range are clamped, so a hairline-thin
   wordmark or a tall crest doesn't blow up the row. */
const STRIP_ASPECT_RANGE = [1, 6] as const;

/**
 * The box of a `strip` logo: equal area for every logo, so its width and
 * height follow the square root of its aspect ratio. Without a known
 * ratio the logo gets a 7rem × 2.5rem box and `object-contain`.
 */
function getStripLogoBox(aspectRatio?: number): {
  width: string;
  height: string;
} {
  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { width: "7rem", height: "2.5rem" };
  }
  const [min, max] = STRIP_ASPECT_RANGE;
  const ratio = Math.min(max, Math.max(min, aspectRatio));
  const height = Math.sqrt(STRIP_LOGO_AREA / ratio);
  const round = (value: number) => `${Math.round(value * 1000) / 1000}rem`;
  return { width: round(height * ratio), height: round(height) };
}

/** Props for {@link LogoWall}. */
export type LogoWallProps = VariantProps<typeof logoWallStyles> & {
  /** The organizations; `name` must be unique (it is the list key). */
  logos: LogoItem[];
  /** Tile size for every logo (`grid` only). */
  size?: LogoTileProps["size"];
  /** Accessible name of the list, e.g. "Research collaborators". */
  label?: string;
  /** Classes merged over the list. */
  className?: string;
};

/**
 * Logos as a list: a grid of white tiles, or (`strip`) one wrapping row of
 * greyscale logos at equal visual weight for light bands.
 */
export function LogoWall({ logos, layout, columns, size = "md", label, className }: LogoWallProps) {
  return (
    <ul aria-label={label} className={cn(logoWallStyles({ layout, columns }), className)}>
      {logos.map(({ aspectRatio, ...logo }) => {
        if (layout !== "strip") {
          return (
            <li key={logo.name} className="flex">
              <LogoTile {...logo} size={size} />
            </li>
          );
        }
        const box = getStripLogoBox(aspectRatio);
        return (
          <li
            key={logo.name}
            className="flex"
            style={{ "--logo-w": box.width, "--logo-h": box.height } as CSSProperties}
          >
            <LogoTile {...logo} variant="mono" />
          </li>
        );
      })}
    </ul>
  );
}
