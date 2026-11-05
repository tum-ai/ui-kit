/**
 * Reduced effects: the kit's answer to devices that can't keep up. While the
 * page scrolls, `watchEffects` samples frame intervals; once they run slow or
 * stutter (`judgeFrames`) it marks the document `data-effects="reduced"` for the
 * rest of the visit. Costly decoration then steps back through the
 * `effects-reduced:` variant (tailwind.css): the header drops its backdrop
 * blur, the most expensive thing to composite over a moving page.
 *
 * The verdict is sticky. Effects never come back during the visit, so the page
 * cannot flicker between the two looks.
 */

/** Intervals longer than this are long tasks or paused tabs, not frame pacing. */
const MAX_INTERVAL = 100;
/** Frames to collect before judging (about two seconds of scrolling at 60 Hz). */
export const MIN_FRAMES = 120;
/** A frame counts as scrolling when it starts this soon after a scroll event. */
const ACTIVE_MS = 100;
/** Keep the frame loop alive this long after the last scroll event. */
const SETTLE_MS = 300;

/** A slow page: the mean frame takes longer than this (under about 45 fps)... */
const SLOW_MEAN = 22;
/** ...or more than `JANK_SHARE` of frames take longer than this (a visible stutter). */
const JANK_INTERVAL = 25;
const JANK_SHARE = 0.25;

/** Mean of the intervals that describe frame pacing (see `MAX_INTERVAL`). */
export function meanInterval(intervals: readonly number[]) {
  const paced = intervals.filter((interval) => interval > 0 && interval <= MAX_INTERVAL);
  if (!paced.length) return 0;
  return paced.reduce((sum, interval) => sum + interval, 0) / paced.length;
}

/**
 * Judges frame intervals (ms) sampled while scrolling: `slow` when the mean
 * frame takes over 22 ms (under about 45 fps), or when over a quarter of the
 * frames take over 25 ms (uneven pacing reads as stutter even at a fair
 * mean); `unknown` until `MIN_FRAMES` intervals are in. The thresholds are in
 * milliseconds, not display frames, so a 120 Hz screen running at a steady
 * 60 fps is fine. A browser that caps animation at 30 fps to save power (Low
 * Power Mode) counts as slow, which suits a reader saving battery.
 */
export function judgeFrames(intervals: readonly number[]): "ok" | "slow" | "unknown" {
  const paced = intervals.filter((interval) => interval > 0 && interval <= MAX_INTERVAL);
  if (paced.length < MIN_FRAMES) return "unknown";
  const janky = paced.filter((interval) => interval > JANK_INTERVAL).length / paced.length;
  return meanInterval(paced) > SLOW_MEAN || janky > JANK_SHARE ? "slow" : "ok";
}

/** True once the document is marked for reduced effects. */
export function effectsReduced() {
  return (
    typeof document !== "undefined" && document.documentElement.dataset["effects"] === "reduced"
  );
}

let watchers = 0;
let stopWatching: (() => void) | null = null;

function start() {
  const intervals: number[] = [];
  let frame = 0;
  let last = 0;
  let lastScroll = 0;

  const tick = (now: number) => {
    // Only frames that follow a scroll closely count: the idle frames after
    // a scroll are cheap and would dilute the verdict.
    const scrolling = now - lastScroll < ACTIVE_MS;
    if (last && scrolling && now - last <= MAX_INTERVAL) intervals.push(now - last);
    last = now;
    // Judge each full window as it fills, so a long scroll that ends on a
    // calm stretch is still caught; partial windows carry over between scrolls.
    if (intervals.length >= MIN_FRAMES) {
      const verdict = judgeFrames(intervals);
      intervals.length = 0;
      if (verdict === "slow") {
        document.documentElement.dataset["effects"] = "reduced";
        stop();
        return;
      }
    }
    if (now - lastScroll < SETTLE_MS) {
      frame = requestAnimationFrame(tick);
      return;
    }
    frame = 0;
    last = 0;
  };
  const onScroll = () => {
    lastScroll = performance.now();
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    window.removeEventListener("scroll", onScroll);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return stop;
}

/**
 * Starts the shared frame watch (once per page however many callers) and
 * returns its release. The `Header` runs it, so every site with the kit
 * shell gets reduced effects without wiring.
 */
export function watchEffects(): () => void {
  if (typeof window === "undefined" || effectsReduced()) return () => {};
  watchers += 1;
  if (watchers === 1) stopWatching = start();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    watchers -= 1;
    if (watchers === 0) {
      stopWatching?.();
      stopWatching = null;
    }
  };
}
