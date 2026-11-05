// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { effectsReduced, judgeFrames, meanInterval, MIN_FRAMES, watchEffects } from "./effects";

const frames = (interval: number, count = MIN_FRAMES) =>
  Array.from({ length: count }, () => interval);

describe("judgeFrames", () => {
  test("waits for enough frames", () => {
    expect(judgeFrames(frames(40, MIN_FRAMES - 1))).toBe("unknown");
  });

  test("passes a steady 60 Hz display", () => {
    expect(judgeFrames(frames(16.7))).toBe("ok");
  });

  test("flags a 60 Hz display that drops a third of its frames", () => {
    const mixed = Array.from({ length: MIN_FRAMES }, (_, i) => (i % 3 === 0 ? 33.4 : 16.7));
    expect(meanInterval(mixed)).toBeGreaterThan(21.7);
    expect(judgeFrames(mixed)).toBe("slow");
  });

  test("passes a 120 Hz display that settles at 60 fps", () => {
    const mixed = Array.from({ length: MIN_FRAMES }, (_, i) => (i % 4 === 0 ? 8.3 : 16.7));
    expect(judgeFrames(mixed)).toBe("ok");
    expect(judgeFrames(frames(8.3))).toBe("ok");
  });

  test("passes an occasional dropped frame", () => {
    const mixed = Array.from({ length: MIN_FRAMES }, (_, i) => (i % 10 === 0 ? 33.4 : 16.7));
    expect(judgeFrames(mixed)).toBe("ok");
  });

  test("flags uneven pacing even when the mean looks fair", () => {
    // Fast frames between frequent long ones: about 49 fps on average, but
    // two frames in five stutter.
    const uneven = Array.from({ length: MIN_FRAMES }, (_, i) => (i % 5 < 2 ? 33.4 : 11.9));
    expect(meanInterval(uneven)).toBeLessThan(22);
    expect(judgeFrames(uneven)).toBe("slow");
  });

  test("counts a 30 fps power-saving cap as slow", () => {
    expect(judgeFrames(frames(33.4))).toBe("slow");
  });

  test("ignores long tasks and paused frames", () => {
    expect(judgeFrames([...frames(16.7), 400, 900, 2000])).toBe("ok");
    expect(meanInterval([0, 400])).toBe(0);
  });
});

describe("watchEffects", () => {
  let now = 0;
  let queue: FrameRequestCallback[] = [];

  beforeEach(() => {
    now = 0;
    queue = [];
    delete document.documentElement.dataset["effects"];
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      queue.push(callback);
      return queue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      queue = [];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset["effects"];
  });

  /** Scrolls for `count` frames `interval` ms apart, then lets the watch settle. */
  function scroll(interval: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      window.dispatchEvent(new Event("scroll"));
      const run = queue;
      queue = [];
      for (const callback of run) callback(now);
      now += interval;
    }
    now += 1000;
    const run = queue;
    queue = [];
    for (const callback of run) callback(now);
  }

  test("marks the document once scrolling runs slow, and stays marked", () => {
    const release = watchEffects();
    scroll(30, MIN_FRAMES + 10);
    expect(effectsReduced()).toBe(true);
    expect(document.documentElement.getAttribute("data-effects")).toBe("reduced");
    release();
    // Already reduced: a later watch is a no-op.
    const again = watchEffects();
    scroll(16.7, MIN_FRAMES + 10);
    expect(effectsReduced()).toBe(true);
    again();
  });

  test("catches a slow stretch even when the scroll ends smoothly", () => {
    const release = watchEffects();
    // One continuous scroll: two slow seconds, then three smooth ones.
    for (let i = 0; i < MIN_FRAMES + 180; i += 1) {
      window.dispatchEvent(new Event("scroll"));
      const run = queue;
      queue = [];
      for (const callback of run) callback(now);
      now += i < MIN_FRAMES ? 30 : 16.7;
    }
    expect(effectsReduced()).toBe(true);
    release();
  });

  test("leaves a smooth page alone and stops listening on release", () => {
    const first = watchEffects();
    const second = watchEffects();
    scroll(16.7, MIN_FRAMES + 10);
    expect(effectsReduced()).toBe(false);
    first();
    first();
    second();
    scroll(40, MIN_FRAMES + 10);
    expect(effectsReduced()).toBe(false);
    expect(queue).toHaveLength(0);
  });
});
