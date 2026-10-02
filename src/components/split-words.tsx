import { Children, Fragment, isValidElement, type ReactNode } from "react";

import { cn } from "../lib/cn";

/** Props for {@link SplitWords}. */
export type SplitWordsProps = {
  /** The headline: text, and elements (e.g. <Highlight>) that move as one word. */
  children: ReactNode;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Delay between words, in ms. */
  step?: number;
  /** Classes for the wrapping span. */
  className?: string;
};

type Unit = { key: string; node: ReactNode; space: boolean };

/** Flattens text into words and spaces, and fragments into their children. */
function splitUnits(children: ReactNode): Unit[] {
  const units: Unit[] = [];
  const seen = new Map<string, number>();
  const keyFor = (base: string) => {
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return `${base}:${count}`;
  };
  const collect = (node: ReactNode) => {
    // eslint-disable-next-line @eslint-react/no-children-to-array -- splitting text children into words needs the flat list
    for (const child of Children.toArray(node)) {
      if (typeof child === "string" || typeof child === "number") {
        for (const part of String(child).split(/(\s+)/)) {
          if (!part) continue;
          const space = /^\s+$/.test(part);
          units.push({
            key: keyFor(space ? "space" : `word:${part}`),
            node: part,
            space,
          });
        }
      } else if (isValidElement(child)) {
        // Unwrap fragments so `<>Build the <Highlight>…</Highlight></>` still
        // animates word by word.
        if (child.type === Fragment) {
          collect((child.props as { children?: ReactNode }).children);
        } else {
          units.push({
            key: keyFor(`element:${String(child.key)}`),
            node: child,
            space: false,
          });
        }
      }
    }
  };
  collect(children);
  return units;
}

/**
 * Headline entrance: words rise and fade in, in sequence. Each word's box is
 * padded (and pulled back with negative margins, so layout is unchanged) to
 * contain descenders and overhangs at tight display line-heights, because
 * Safari clips an animating inline-block to its box (docs/browser-quirks.md).
 * Pure CSS, so it starts
 * before hydration and never delays LCP. Strings are split into words;
 * elements (e.g. <Highlight>) animate as one unit. Reduced motion renders the
 * text statically.
 *
 * Words are inline blocks, so never combine it with `hyphens-auto`: a word
 * box cannot hyphenate, only overflow.
 */
export function SplitWords({ children, delay = 0, step = 70, className }: SplitWordsProps) {
  let wordIndex = 0;
  return (
    <span className={className}>
      {splitUnits(children).map(({ key, node, space }) => {
        if (space) return <Fragment key={key}> </Fragment>;
        const current = wordIndex++;
        return (
          <span
            key={key}
            className={cn(
              "-mx-[0.06em] -mt-[0.12em] -mb-[0.32em] inline-block px-[0.06em] pt-[0.12em] pb-[0.32em] motion-safe:animate-rise",
            )}
            style={{ animationDelay: `${delay + current * step}ms` }}
          >
            {node}
          </span>
        );
      })}
    </span>
  );
}
