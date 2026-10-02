import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { keyedChildren } from "./internal";

/** Props for {@link BulletList}. */
export type BulletListProps = Omit<ComponentProps<"ul">, "children"> & {
  /**
   * The points, in order. Text items are keyed by their text, so keep them
   * unique; give elements their own `key`.
   */
  items: ReactNode[];
};

/**
 * A short list of points set as raised rows, each with an accent dot, e.g.
 * the options an answer introduces ("Members can join one of two tracks:").
 * The rows read the band tone, so the list works inside FAQ answers and
 * cards alike.
 */
export function BulletList({ items, className, ...props }: BulletListProps) {
  return (
    <ul className={cn("space-y-3", className)} {...props}>
      {keyedChildren(items).map(({ key, node }) => (
        <li
          key={key}
          className="rounded-2xl py-4 pr-5 pl-9 before:left-4 before:size-1.5 relative bg-raised ring-1 ring-hairline ring-inset before:absolute before:top-[1.6rem] before:rounded-full before:bg-highlight"
        >
          {node}
        </li>
      ))}
    </ul>
  );
}
