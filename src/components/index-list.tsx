"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useState } from "react";

import { cn } from "../lib/cn";
import { Anchor } from "./anchor";
import { isUnoptimizedRemoteImage } from "./internal";
import type { HeadingLevel } from "./types";

/** One destination in an {@link IndexList}. */
export type IndexListItem = {
  /** Stable key. */
  id: string;
  /** Destination name, set large. */
  title: string;
  /** One sentence on what is there, ideally with one concrete fact. */
  description: ReactNode;
  /** Short aside at the end of the row on wide screens (e.g. a status or figure). */
  detail?: ReactNode;
  /** Route or URL. */
  href: string;
  /**
   * Photo for the destination: the sticky preview beside the list from `lg`,
   * an inline thumbnail below it. Decorative, since the title names the row.
   */
  image?: {
    /** Photo URL or local path. */
    src: string;
    /** CSS crop position. */
    position?: string;
    /**
     * Skip optimization. Defaults to true for absolute http(s) sources.
     * Set false to opt in and configure the consumer app's `images.remotePatterns`.
     */
    unoptimized?: boolean;
  };
};

/** Props for {@link IndexList}. */
export type IndexListProps = {
  /** The destinations, in reading order. */
  items: IndexListItem[];
  /** Heading level of each title. Default `h3`. */
  headingAs?: HeadingLevel;
  /** Classes merged over the wrapper. */
  className?: string;
};

/* The parts of a row that recede while another row is active (see IndexList). */
const recedingTitle =
  "group-hover/index:group-data-[active=false]/item:text-fg-muted group-has-[a:focus-visible]/index:group-data-[active=false]/item:text-fg-muted";
const recedingMark =
  "group-hover/index:group-data-[active=false]/item:opacity-45 group-has-[a:focus-visible]/index:group-data-[active=false]/item:opacity-45";

/**
 * A typographic index of destinations: full-width link rows with a large
 * light title, one line of description and an arrow, separated by hairlines.
 * On wide screens a sticky photo beside the list shows the row that is
 * hovered or focused (the first one until then), and while the pointer or
 * keyboard focus is in the list the other rows recede: their titles turn
 * muted and their arrows and thumbnails fade; descriptions and details keep
 * their full contrast.
 * Keyboard focus drives the preview exactly like the pointer.
 */
export function IndexList({ items, headingAs: HeadingTag = "h3", className }: IndexListProps) {
  const [hovered, setHovered] = useState(items[0]?.id);
  // The first row when the chosen one has left the list (a live refresh).
  const active = items.some((item) => item.id === hovered) ? hovered : items[0]?.id;
  const withMedia = items.some((item) => item.image);

  return (
    <div className={cn("gap-12 grid", withMedia && "lg:grid-cols-12 lg:gap-16", className)}>
      <ul
        className={cn("group/index border-t border-hairline-strong", withMedia && "lg:col-span-7")}
      >
        {items.map((item) => (
          <li
            key={item.id}
            data-active={item.id === active}
            className="group/item border-b border-hairline"
          >
            <Anchor
              href={item.href}
              onPointerEnter={() => setHovered(item.id)}
              onFocus={() => setHovered(item.id)}
              className="group/row gap-x-6 gap-y-3 py-7 md:py-9 grid grid-cols-[minmax(0,1fr)_auto] items-center"
            >
              <div className="min-w-0">
                {/* A word wider than the column (a long title beside the
                    thumbnail at 320px) breaks instead of running under it. */}
                <HeadingTag
                  className={cn(
                    "group-hover/row:translate-x-2 text-display-md wrap-break-word text-fg transition-[color,translate] duration-500 ease-brand motion-reduce:transition-none",
                    recedingTitle,
                  )}
                >
                  {item.title}
                </HeadingTag>
                <p className="mt-3 max-w-xl md:text-body text-small text-fg-muted">
                  {item.description}
                </p>
              </div>
              <div className="gap-6 pt-2 md:self-center md:pt-0 flex items-center self-start">
                {item.detail ? (
                  <div className="md:block hidden text-right text-meta text-fg-muted">
                    {item.detail}
                  </div>
                ) : null}
                {item.image ? (
                  <div
                    className={cn(
                      "size-16 rounded-2xl sm:size-20 lg:hidden relative shrink-0 overflow-hidden bg-sunken transition-opacity duration-500 ease-brand motion-reduce:transition-none",
                      recedingMark,
                    )}
                  >
                    <Image
                      src={item.image.src}
                      alt=""
                      fill
                      sizes="5rem"
                      unoptimized={
                        item.image.unoptimized ?? isUnoptimizedRemoteImage(item.image.src)
                      }
                      className="object-cover"
                      style={{ objectPosition: item.image.position }}
                    />
                  </div>
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-12 sm:grid hidden shrink-0 place-items-center rounded-full border border-hairline-strong text-fg transition-[color,background-color,border-color,opacity] duration-300 ease-brand group-hover/row:border-fg group-hover/row:bg-fg group-hover/row:text-canvas",
                    recedingMark,
                  )}
                >
                  <ArrowRight className="size-4 transition-transform duration-500 ease-brand group-hover/row:-rotate-45 motion-reduce:transition-none" />
                </span>
              </div>
            </Anchor>
          </li>
        ))}
      </ul>

      {withMedia ? (
        <div aria-hidden="true" className="lg:col-span-5 lg:block hidden">
          <div className="sticky top-[var(--header-offset)]">
            {/* next/image `fill` needs a positioned (not sticky) parent. */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-4xl bg-sunken">
              {items.map((item) =>
                item.image ? (
                  <Image
                    key={item.id}
                    src={item.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 30rem, 38vw"
                    unoptimized={item.image.unoptimized ?? isUnoptimizedRemoteImage(item.image.src)}
                    data-active={item.id === active}
                    className="scale-[1.03] object-cover opacity-0 transition-[opacity,scale] duration-700 ease-brand data-[active=true]:scale-100 data-[active=true]:opacity-100 motion-reduce:transition-none"
                    style={{ objectPosition: item.image.position }}
                  />
                ) : null,
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
