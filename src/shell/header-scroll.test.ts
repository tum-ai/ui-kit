import { describe, expect, test } from "vitest";

import { getHeaderScrollState, headerFrostAfter } from "./header-scroll";

describe("frosted pill", () => {
  test("stays transparent at the top of the page", () => {
    expect(getHeaderScrollState({ scrollY: 0 }).scrolled).toBe(false);
    expect(getHeaderScrollState({ scrollY: headerFrostAfter }).scrolled).toBe(false);
  });

  test("frosts once the page scrolls past the threshold", () => {
    expect(getHeaderScrollState({ scrollY: headerFrostAfter + 1 }).scrolled).toBe(true);
  });

  test("treats rubber-band overscroll above the top as the top", () => {
    expect(getHeaderScrollState({ scrollY: -120 })).toStrictEqual(
      getHeaderScrollState({ scrollY: 0 }),
    );
  });
});

test("depends on the position, not the scroll direction", () => {
  // The header never hides: scrolling back up to a position gives the same
  // state as scrolling down to it.
  const path = [0, 400, 900, 400, 0].map((scrollY) => getHeaderScrollState({ scrollY }));
  expect(path[1]).toStrictEqual(path[3]);
  expect(path[0]).toStrictEqual(path[4]);
  expect(path[2]).toStrictEqual({ scrolled: true });
});
