import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { isUnoptimizedRemoteImage } from "./internal";

/** Frame of a {@link Photo}: its aspect ratio and corner treatment. */
const photoFrameStyles = cva("relative overflow-hidden bg-sunken", {
  variants: {
    /**
     * Aspect ratio of the frame; the photo is cropped to fill it.
     * `panorama` is for wide group shots: 4:3 on phones, 2:1 from `sm` and
     * 24:7 from `lg`, so faces stay large enough on every screen.
     */
    aspect: {
      "3/2": "aspect-[3/2]",
      "4/3": "aspect-[4/3]",
      "16/10": "aspect-[16/10]",
      "4/5": "aspect-[4/5]",
      "1/1": "aspect-square",
      panorama: "sm:aspect-[2/1] lg:aspect-[24/7] aspect-[4/3]",
    },
    /**
     * `rounded` is the brand's large photo radius; `bleed` has square
     * corners for photos that run to the edge of the viewport or a panel.
     */
    shape: {
      rounded: "rounded-4xl",
      bleed: "rounded-none",
    },
  },
  defaultVariants: { aspect: "3/2", shape: "rounded" },
});

/** Props for {@link Photo}. */
export type PhotoProps = Omit<ComponentProps<"figure">, "children"> &
  VariantProps<typeof photoFrameStyles> & {
    /** Image path under /public or an allowed remote URL. */
    src: string;
    /**
     * What the photo shows, for screen readers. Required: photos carry
     * content. Screen readers read it before the caption, so describe what
     * the caption leaves out rather than repeating it.
     */
    alt: string;
    /**
     * A factual caption under the photo: what, where and when. Never a
     * slogan; leave it out rather than guess.
     */
    caption?: ReactNode;
    /** `object-position` of the crop, e.g. "50% 30%" to keep faces in frame. */
    position?: string;
    /** Responsive `sizes` for next/image. Default: the full viewport width. */
    sizes?: string;
    /**
     * Load immediately with high fetch priority, for a photo that is the
     * largest element above the fold. It adds no preload tag.
     */
    eager?: boolean;
    /**
     * Skip optimization. Defaults to true for absolute http(s) sources.
     * Set false to optimize remote images and configure the consumer app's
     * `images.remotePatterns`. Local assets use Next.js defaults.
     */
    unoptimized?: boolean;
    /** Class overrides for the frame and the caption. */
    classNames?: { frame?: string; caption?: string };
  };

/**
 * A documentary photo with its caption, in the brand's frame: cropped to a
 * fixed aspect, rounded (or bleeding to the edge), with the caption set small
 * underneath. Zooms slightly when an ancestor with `group/zoom` is hovered.
 */
export function Photo({
  src,
  alt,
  caption,
  position,
  sizes = "100vw",
  eager = false,
  unoptimized,
  aspect,
  shape,
  classNames,
  className,
  ...props
}: PhotoProps) {
  return (
    <figure className={cn("flex flex-col", className)} {...props}>
      <div className={cn(photoFrameStyles({ aspect, shape }), classNames?.frame)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized={unoptimized ?? isUnoptimizedRemoteImage(src)}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className="zoom-media object-cover"
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
      {caption ? (
        <figcaption className={cn("mt-4 text-meta text-fg-subtle", classNames?.caption)}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
