"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import type { HalftoneHandle, HalftoneOptions, HalftoneState } from "./renderer";

/** Props of {@link HalftoneField}. */
export type HalftoneFieldProps = {
  /** Grid cell in CSS px. */
  cell?: number;
  /** Frame rate cap while animating (default 60). */
  fps?: number;
  /** Speed of the waves (default 1). */
  speed?: number;
  /** Follow fine pointers with a lens. */
  pointer?: boolean;
  /** Bloom outward from the sun when the field first draws. */
  rise?: boolean;
  /** Bloom duration in seconds (default 1.8). */
  riseDuration?: number;
  /** The element whose centre the dots warm toward. */
  sunRef?: RefObject<HTMLElement | null>;
  /** An element whose box stays mostly clear of dots (the headline). */
  clearRef?: RefObject<HTMLElement | null>;
  /** Starting state: sun, density, colours, fades (see `HalftoneState`). */
  initial?: Partial<HalftoneState>;
  /** Receives the renderer once it runs, to drive it (a scroll replay, say). */
  onReady?: (handle: HalftoneHandle) => void;
  /** Classes for the root, which is `position: absolute; inset: 0`. */
  className?: string;
};

/**
 * `pending` until the renderer has tried (the CSS dots stay hidden, so they
 * never flash before the live field), then `webgl`, or `css` when WebGL is
 * unavailable and `lost` after a lost context (both show the CSS dots).
 */
type Mode = "pending" | "css" | "webgl" | "lost";

/**
 * A halftone dot field after the Makeathon posters: a warped dot grid that
 * breathes in slow waves, dense at the edges, warming toward a sun. Once the
 * page is idle the WebGL2 renderer loads, draws its first frame and the
 * canvas fades in; it draws only while on screen, and a single still frame
 * under reduced motion. A CSS dot pattern rendered by the server stands in
 * only where the live field cannot: without JavaScript, without WebGL, or
 * after a lost context. Fills its nearest positioned ancestor (`absolute
 * inset-0`). Needs `@tum.ai/ui-kit/halftone.css`. Decorative: hidden from
 * assistive technology.
 */
export function HalftoneField({
  cell = 14,
  fps,
  speed,
  pointer = false,
  rise = true,
  riseDuration,
  sunRef,
  clearRef,
  initial,
  onReady,
  className,
}: HalftoneFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  // The renderer reads the latest props once, when it starts.
  const optionsRef = useRef<(HalftoneOptions & { onReady?: typeof onReady }) | null>(null);
  useEffect(() => {
    optionsRef.current = { cell, fps, speed, pointer, rise, riseDuration, initial, onReady };
  });

  useEffect(() => {
    let handle: HalftoneHandle | null = null;
    let cancelled = false;
    const load = () => {
      void import("./renderer").then(({ createHalftone }) => {
        const canvas = canvasRef.current;
        const current = optionsRef.current;
        if (cancelled || !canvas || !current) return;
        handle = createHalftone(canvas, {
          ...current,
          sunElement: sunRef?.current ?? null,
          clearElement: clearRef?.current ?? null,
        });
        if (!handle) {
          setMode("css");
          return;
        }
        handle.onFirstFrame(() => !cancelled && setMode("webgl"));
        handle.onLost(() => !cancelled && setMode("lost"));
        current.onReady?.(handle);
      });
    };
    // Older Safari has no requestIdleCallback.
    const hasIdle = "requestIdleCallback" in window;
    const idle = hasIdle
      ? window.requestIdleCallback(load, { timeout: 900 })
      : window.setTimeout(load, 120);
    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      handle?.destroy();
    };
  }, [sunRef, clearRef]);

  return (
    <div
      aria-hidden="true"
      data-halftone={mode}
      className={className ? `halftone ${className}` : "halftone"}
    >
      <div className="halftone-fallback" />
      <canvas ref={canvasRef} className="halftone-canvas" />
    </div>
  );
}
