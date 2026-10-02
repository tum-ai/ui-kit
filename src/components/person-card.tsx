import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { isUnoptimizedRemoteImage } from "./internal";
import type { HeadingLevel } from "./types";

/** Props for {@link PersonCard}. */
export type PersonCardProps = {
  /** The person's name (also the default `alt`). */
  name: string;
  /** Line under the name: role or affiliation. */
  byline?: ReactNode;
  /**
   * Portrait, cropped to 4:5. `position` is a CSS `object-position` (for
   * example "50% 20%") that keeps the face in frame when the crop cuts it.
   */
  image: { src: string; alt?: string; position?: string };
  /** A short bio or links under the byline. */
  children?: ReactNode;
  /** Heading level of the name. Default `h3`. */
  headingAs?: HeadingLevel;
  /** next/image `sizes`. */
  sizes?: string;
  /**
   * Skip optimization. Defaults to true for absolute http(s) sources, false
   * for local assets. Set false to optimize remote images and configure the
   * consumer app's `images.remotePatterns`.
   */
  unoptimized?: boolean;
  /** Classes merged over the `figure`. */
  className?: string;
};

/** Portrait card for members, speakers and alumni. */
export function PersonCard({
  name,
  byline,
  image,
  children,
  headingAs: HeadingTag = "h3",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw",
  unoptimized,
  className,
}: PersonCardProps) {
  return (
    <figure className={cn("group/zoom", className)}>
      <div className="rounded-3xl relative aspect-[4/5] overflow-hidden bg-sunken">
        <Image
          src={image.src}
          alt={image.alt ?? name}
          fill
          sizes={sizes}
          unoptimized={unoptimized ?? isUnoptimizedRemoteImage(image.src)}
          style={image.position ? { objectPosition: image.position } : undefined}
          className="zoom-media object-cover"
        />
      </div>
      <figcaption className="mt-4">
        <HeadingTag className="text-heading-sm text-fg">{name}</HeadingTag>
        {byline ? <p className="mt-0.5 text-meta text-fg-subtle">{byline}</p> : null}
        {children ? <div className="mt-3 text-small text-fg-muted">{children}</div> : null}
      </figcaption>
    </figure>
  );
}
