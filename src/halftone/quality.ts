/**
 * Quality levels for the halftone renderer. A field starts at the shared
 * level and steps down whenever its own frames run slow: first fewer pixels,
 * then fewer frames, then one still frame (the reduced-motion look). It never
 * steps back up, so a struggling device can't oscillate between levels. The
 * level is shared by every field on the page (one module instance), so a
 * field further down starts where the first one settled.
 */

/** One rung of the ladder. */
export type QualityLevel = {
  /** Fraction of the renderer's pixel budget. */
  budget: number;
  /** Frame rate cap (the field's own `fps` applies when lower). */
  fps: number;
  /** Draw one still frame instead of animating. */
  still: boolean;
};

/** The ladder, full quality first. */
export const QUALITY_LEVELS: readonly QualityLevel[] = [
  { budget: 1, fps: 60, still: false },
  { budget: 0.5, fps: 60, still: false },
  { budget: 0.35, fps: 30, still: false },
  { budget: 0.35, fps: 30, still: true },
];

/** Drawn frames to collect before judging a level. */
export const QUALITY_SAMPLES = 45;
/** Frames this far behind the level's frame interval mean the GPU can't keep up. */
const SLOW_FACTOR = 1.35;

/** Hardware hints, where the browser exposes them. */
export type DeviceHints = {
  /** `navigator.deviceMemory` in GiB (Chromium only). */
  deviceMemory?: number;
  /** `navigator.hardwareConcurrency`. */
  hardwareConcurrency?: number;
};

/** The level to start at: one step down on devices with very little memory or very few cores. */
export function initialLevel({ deviceMemory, hardwareConcurrency }: DeviceHints) {
  const small =
    (deviceMemory !== undefined && deviceMemory <= 2) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 2);
  return small ? 1 : 0;
}

/**
 * Whether drawn-frame intervals (ms) at a frame interval of `target` ms are
 * too slow for the level: their mean is 35 % above the target. Needs
 * `QUALITY_SAMPLES` intervals; longer stalls (over 250 ms: a busy main thread
 * or a background tab) don't count.
 */
export function tooSlow(intervals: readonly number[], target: number) {
  const paced = intervals.filter((interval) => interval > 0 && interval <= 250);
  if (paced.length < QUALITY_SAMPLES) return false;
  const mean = paced.reduce((sum, interval) => sum + interval, 0) / paced.length;
  return mean > target * SLOW_FACTOR;
}

let shared: number | null = null;

/** The page's current level, starting from the device hints. */
export function sharedLevel(hints: DeviceHints) {
  shared ??= initialLevel(hints);
  return shared;
}

/** Records that a field stepped down to `level`; later fields start there. */
export function lowerSharedLevel(level: number) {
  shared = Math.max(shared ?? 0, Math.min(level, QUALITY_LEVELS.length - 1));
}

/** Test hook: forget the shared level. */
export function resetSharedLevel() {
  shared = null;
}
