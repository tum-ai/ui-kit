/*
 * Helpers shared by design-system components (server and client). Not
 * exported from the barrel. Hooks live in refs.ts, which only client
 * components import.
 */

import { Children, isValidElement, type ReactNode } from "react";

/** A child with the key React would give it, for re-wrapping in a list. */
export type KeyedChild = { key: string; node: ReactNode };

/**
 * Flattens `children` and pairs each child with a stable key: an element
 * keeps the key `Children.toArray` gives it (its own key, else its slot);
 * text and numbers are keyed by their value and how often it occurred
 * before, so repeated words stay distinct. Empty children are dropped.
 */
export function keyedChildren(children: ReactNode): KeyedChild[] {
  const seen = new Map<string, number>();
  return Children.toArray(children).map((node) => {
    if (isValidElement(node) && node.key !== null) {
      return { key: String(node.key), node };
    }
    const text = String(node);
    const count = seen.get(text) ?? 0;
    seen.set(text, count + 1);
    return { key: `text:${text}:${count}`, node };
  });
}

/** A key for list items whose content may be text or markup. */
export function textKey(node: ReactNode, fallback: string): string {
  return typeof node === "string" || typeof node === "number" ? String(node) : fallback;
}

/** "01"-style counter for editorial numbering. */
export function counter(position: number): string {
  return String(position).padStart(2, "0");
}

/**
 * Whether the visitor asked for reduced motion. Only call it in effects and
 * event handlers: the server cannot know the preference.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Whether a link leaves the site (http or https), and so opens a new tab. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Whether a remote image should bypass optimization unless the caller opts in. */
export function isUnoptimizedRemoteImage(src: string): boolean {
  return isExternalHref(src);
}

/**
 * Whether a link must be a plain `<a>` rather than next/link: other sites,
 * mail and phone links, and in-page anchors.
 */
export function isNonRouteHref(href: string): boolean {
  return /^(https?:|mailto:|tel:|#)/.test(href);
}
