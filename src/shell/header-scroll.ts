/**
 * How the floating header reacts to the scroll position. Pure, so the
 * threshold is testable without a browser; `header.tsx` feeds it the
 * window's scroll position on every scroll and resize frame.
 *
 * The header never hides: its state depends only on where the page is, not
 * on the direction it last moved.
 */

/** Scroll distance in px after which the transparent pill turns frosted. */
export const headerFrostAfter = 8;

/** The window measurements the header state depends on. */
export type HeaderScrollInput = {
  /** `window.scrollY`; negative values (rubber-band overscroll) count as 0. */
  scrollY: number;
};

/** What the header shows for a scroll position. */
export type HeaderScrollState = {
  /** The page has left the top: frost the pill. */
  scrolled: boolean;
};

/** The header state for the current scroll position. */
export function getHeaderScrollState({ scrollY }: HeaderScrollInput): HeaderScrollState {
  return { scrolled: Math.max(scrollY, 0) > headerFrostAfter };
}
