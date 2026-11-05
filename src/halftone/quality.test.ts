import { afterEach, describe, expect, test } from "vitest";

import {
  initialLevel,
  lowerSharedLevel,
  QUALITY_LEVELS,
  QUALITY_SAMPLES,
  resetSharedLevel,
  sharedLevel,
  tooSlow,
} from "./quality";

const frames = (interval: number, count = QUALITY_SAMPLES) =>
  Array.from({ length: count }, () => interval);

describe("quality ladder", () => {
  test("steps down pixels first, then frames, and ends on a still frame", () => {
    const [full, ...rest] = QUALITY_LEVELS;
    expect(full).toEqual({ budget: 1, fps: 60, still: false });
    for (const [i, level] of rest.entries()) {
      const previous = QUALITY_LEVELS[i];
      expect(level.budget).toBeLessThanOrEqual(previous?.budget ?? 1);
      expect(level.fps).toBeLessThanOrEqual(previous?.fps ?? 60);
    }
    expect(QUALITY_LEVELS.at(-1)?.still).toBe(true);
  });
});

describe("initialLevel", () => {
  test("starts one step down only on very small devices", () => {
    expect(initialLevel({})).toBe(0);
    expect(initialLevel({ deviceMemory: 4, hardwareConcurrency: 4 })).toBe(0);
    expect(initialLevel({ deviceMemory: 2 })).toBe(1);
    expect(initialLevel({ hardwareConcurrency: 2 })).toBe(1);
  });
});

describe("tooSlow", () => {
  test("waits for a full window", () => {
    expect(tooSlow(frames(50, QUALITY_SAMPLES - 1), 16.7)).toBe(false);
  });

  test("passes frames on time and flags frames well behind", () => {
    expect(tooSlow(frames(16.7), 16.7)).toBe(false);
    expect(tooSlow(frames(20), 16.7)).toBe(false);
    expect(tooSlow(frames(33.4), 16.7)).toBe(true);
    // A 40 fps cap on a 60 Hz display paces at 33 ms: on time.
    expect(tooSlow(frames(33.4), 33.4)).toBe(false);
  });

  test("ignores stalls from a busy main thread or a background tab", () => {
    expect(tooSlow([...frames(16.7), 400, 1200], 16.7)).toBe(false);
  });
});

describe("shared level", () => {
  afterEach(() => resetSharedLevel());

  test("starts from the hints and only ever goes down", () => {
    expect(sharedLevel({ deviceMemory: 2 })).toBe(1);
    // Later fields keep the page's level, whatever their hints.
    expect(sharedLevel({ deviceMemory: 8 })).toBe(1);
    lowerSharedLevel(2);
    expect(sharedLevel({})).toBe(2);
    lowerSharedLevel(1);
    expect(sharedLevel({})).toBe(2);
    lowerSharedLevel(99);
    expect(sharedLevel({})).toBe(QUALITY_LEVELS.length - 1);
  });
});
