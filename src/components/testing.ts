/*
 * Browser APIs that jsdom lacks, for the design-system component tests. Test
 * code only: nothing in the barrel imports this file.
 */

import { vi } from "vitest";

/** Stubs `matchMedia`; `reducedMotion` answers the reduced-motion query. */
export function stubMatchMedia({ reducedMotion = false } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce") ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  targets: Set<Element>;
};

/**
 * Stubs `IntersectionObserver` and `ResizeObserver`. Returns `intersect`,
 * which reports elements as entering the viewport to every observer that
 * watches them.
 */
export function stubObservers() {
  const observers = new Set<ObserverRecord>();

  class FakeIntersectionObserver {
    readonly record: ObserverRecord;
    constructor(callback: IntersectionObserverCallback) {
      this.record = { callback, targets: new Set() };
      observers.add(this.record);
    }
    observe(target: Element) {
      this.record.targets.add(target);
    }
    unobserve(target: Element) {
      this.record.targets.delete(target);
    }
    disconnect() {
      this.record.targets.clear();
      observers.delete(this.record);
    }
    takeRecords() {
      return [];
    }
  }

  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);

  return {
    /** Reports `elements` as intersecting to the observers that watch them. */
    intersect: (...elements: Element[]) => {
      for (const record of [...observers]) {
        const entries = elements
          .filter((element) => record.targets.has(element))
          .map(
            (target) =>
              ({
                target,
                isIntersecting: true,
                intersectionRatio: 1,
                boundingClientRect: target.getBoundingClientRect(),
              }) as IntersectionObserverEntry,
          );
        if (entries.length > 0) {
          record.callback(entries, {} as IntersectionObserver);
        }
      }
    },
  };
}

/**
 * Reports every element as starting below the fold (jsdom lays nothing out,
 * so every box is at 0,0, which reads as "already on screen").
 */
export function placeBelowFold() {
  const top = window.innerHeight * 2;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 100,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}
