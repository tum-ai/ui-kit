/**
 * A framework-free WebGL2 renderer for the halftone field. Loaded lazily by
 * `HalftoneField` after the page is idle, so it never delays the first paint.
 *
 * Lifecycle: it draws only while the canvas is on screen and the tab is
 * visible, caps the pixel ratio and the pixel count, and under reduced
 * motion draws a single still frame (redrawn on resize). On context loss it
 * stops and reports, so the CSS fallback can take over.
 */
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

type Rgb = readonly [number, number, number];

/** What the field draws; set it with `initial` or `HalftoneHandle.set`. */
export type HalftoneState = {
  /** Sun centre and radius in CSS px, relative to the canvas. */
  sun: { x: number; y: number; r: number };
  /** Bloom progress, 0 to 1 (animated from 0 on start unless `rise` is false). */
  rise: number;
  /** Overall dot size, 0 to 1. */
  density: number;
  /** How far the sun's warmth reaches, 0 to 1. */
  warm: number;
  /** How strongly the dots favour the edges over the centre, 0 to 1. */
  edge: number;
  /** Overall opacity, 0 to 1. */
  alpha: number;
  /** Dot colour, linear RGB 0 to 1 (default the ramp's 600). */
  dot: Rgb;
  /** Dot colour next to the sun (default the ramp's 200). */
  hot: Rgb;
  /** A rectangle (CSS px, relative to the canvas) kept mostly clear of dots. */
  clear: { x0: number; y0: number; x1: number; y1: number } | null;
  /** Dots grow in between these heights (fractions of the canvas, top down). */
  fadeTop: readonly [number, number] | null;
  /** Dots dissolve between these heights (fractions of the canvas, top down). */
  fadeBottom: readonly [number, number] | null;
};

/** Renderer options; `HalftoneField` passes its props through. */
export type HalftoneOptions = {
  /** Grid cell in CSS px. */
  cell: number;
  /** Frame rate cap while animating. */
  fps?: number;
  /** Speed of the waves (1 = default). */
  speed?: number;
  /** Follow the pointer with a lens (fine pointers only). */
  pointer?: boolean;
  /** Animate the bloom from the sun when the field first appears. */
  rise?: boolean;
  /** Bloom duration in seconds. */
  riseDuration?: number;
  /** An element whose centre is the sun; tracked every frame. */
  sunElement?: HTMLElement | null;
  /** An element whose box is kept clear of dots; measured on resize. */
  clearElement?: HTMLElement | null;
  /** Starting state. */
  initial?: Partial<HalftoneState>;
};

/** A running field, handed to `HalftoneField`'s `onReady`. */
export type HalftoneHandle = {
  /** Merge a new state; redraws at once when not animating. */
  set(state: Partial<HalftoneState>): void;
  /** Redraw now (for a still frame after `set`). */
  draw(): void;
  /** Stop, release the observers and lose the context. */
  destroy(): void;
  /** Call back after the first frame (at once if it was drawn). */
  onFirstFrame(callback: () => void): void;
  /** Call back when the WebGL context is lost. */
  onLost(callback: () => void): void;
};

const SUN_DOT: Rgb = [0xd9 / 255, 0x90 / 255, 0x5b / 255];
const SUN_HOT: Rgb = [0xff / 255, 0xe0 / 255, 0x7a / 255];

const UNIFORMS = [
  "uRes",
  "uCell",
  "uTime",
  "uPointer",
  "uPointerAmt",
  "uSun",
  "uRise",
  "uDensity",
  "uDot",
  "uHot",
  "uWarm",
  "uClear",
  "uEdge",
  "uAlpha",
  "uFadeTop",
  "uFadeBottom",
] as const;

/** Device pixel ratio for a canvas: capped at 2 and at a pixel budget. */
export function effectiveDpr(width: number, height: number, dpr: number, coarse: boolean) {
  const budget = coarse ? 2_000_000 : 3_500_000;
  const capped = Math.min(dpr, 2);
  const area = Math.max(1, width * height);
  return Math.max(1, Math.min(capped, Math.sqrt(budget / area)));
}

/** ease-brand, cubic-bezier(0.22, 1, 0.36, 1), approximated by an ease-out quint. */
const easeOut = (t: number) => 1 - (1 - t) ** 5;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Start the field on a canvas. Returns null without WebGL2 or when the
 * shaders fail, so the caller can show the CSS dots instead.
 */
export function createHalftone(
  canvas: HTMLCanvasElement,
  options: HalftoneOptions,
): HalftoneHandle | null {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fps = options.fps ?? 60;
  const speed = options.speed ?? 1;

  const state: HalftoneState = {
    sun: { x: -9999, y: -9999, r: 1 },
    rise: options.rise === false || reduced ? 1 : 0,
    density: 1,
    warm: 1,
    edge: 1,
    alpha: 0.9,
    dot: SUN_DOT,
    hot: SUN_HOT,
    clear: null,
    fadeTop: null,
    fadeBottom: null,
    ...options.initial,
  };

  let program: WebGLProgram | null = null;
  const locations = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let visible = false;
  let lost = false;
  let destroyed = false;
  let lastFrame = 0;
  let clock = 0;
  let riseStart = -1;
  const pointer = { x: -9999, y: -9999, amt: 0, targetX: -9999, targetY: -9999, targetAmt: 0 };
  const firstFrame: (() => void)[] = [];
  const lostCallbacks: (() => void)[] = [];
  let drewFirst = false;

  function setup() {
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return false;
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // One triangle that covers the viewport.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const name of UNIFORMS) locations[name] = gl.getUniformLocation(program, name);
    gl.clearColor(0, 0, 0, 0);
    return true;
  }

  if (!setup()) return null;

  function measureClear() {
    const el = options.clearElement;
    if (!el) return;
    const box = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    state.clear = {
      x0: r.left - box.left,
      y0: r.top - box.top,
      x1: r.right - box.left,
      y1: r.bottom - box.top,
    };
  }

  function trackSun() {
    const el = options.sunElement;
    if (!el) return;
    const box = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    state.sun = {
      x: r.left + r.width / 2 - box.left,
      y: r.top + r.height / 2 - box.top,
      r: r.width / 2,
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = effectiveDpr(width, height, window.devicePixelRatio || 1, coarse);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    measureClear();
    if (!running) draw();
  }

  function draw() {
    if (lost || destroyed || !program) return;
    trackSun();
    const cell = options.cell * (coarse ? 0.86 : 1) * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(locations.uRes, canvas.width, canvas.height);
    gl.uniform1f(locations.uCell, cell);
    gl.uniform1f(locations.uTime, clock);
    gl.uniform2f(locations.uPointer, pointer.x * dpr, pointer.y * dpr);
    gl.uniform1f(locations.uPointerAmt, pointer.amt);
    gl.uniform3f(locations.uSun, state.sun.x * dpr, state.sun.y * dpr, state.sun.r * dpr);
    gl.uniform1f(locations.uRise, state.rise);
    gl.uniform1f(locations.uDensity, state.density);
    gl.uniform3f(locations.uDot, ...state.dot);
    gl.uniform3f(locations.uHot, ...state.hot);
    gl.uniform1f(locations.uWarm, state.warm);
    const c = state.clear;
    if (c) gl.uniform4f(locations.uClear, c.x0 * dpr, c.y0 * dpr, c.x1 * dpr, c.y1 * dpr);
    else gl.uniform4f(locations.uClear, 1, 1, 0, 0);
    gl.uniform1f(locations.uEdge, state.edge);
    gl.uniform1f(locations.uAlpha, state.alpha);
    gl.uniform2f(locations.uFadeTop, ...(state.fadeTop ?? ([1, 0] as const)));
    gl.uniform2f(locations.uFadeBottom, ...(state.fadeBottom ?? ([1, 0] as const)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!drewFirst) {
      drewFirst = true;
      for (const callback of firstFrame) callback();
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (now - lastFrame < 1000 / fps - 2) return;
    const dt = Math.min(0.1, lastFrame ? (now - lastFrame) / 1000 : 0);
    lastFrame = now;
    clock += dt * speed;
    if (state.rise < 1) {
      if (riseStart < 0) riseStart = now;
      const duration = (options.riseDuration ?? 1.8) * 1000;
      state.rise = easeOut(Math.min(1, (now - riseStart) / duration));
    }
    const k = 1 - Math.exp(-dt * 7);
    pointer.x += (pointer.targetX - pointer.x) * (pointer.x < -9000 ? 1 : k);
    pointer.y += (pointer.targetY - pointer.y) * (pointer.y < -9000 ? 1 : k);
    pointer.amt += (pointer.targetAmt - pointer.amt) * k;
    draw();
  }

  function start() {
    if (running || reduced || lost || destroyed || !visible || document.hidden) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);

  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) {
        start();
        if (reduced) draw();
      } else stop();
    },
    { rootMargin: "120px 0px" },
  );
  intersection.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const box = canvas.getBoundingClientRect();
    pointer.targetX = event.clientX - box.left;
    pointer.targetY = event.clientY - box.top;
    const inside =
      pointer.targetX >= 0 &&
      pointer.targetY >= 0 &&
      pointer.targetX <= box.width &&
      pointer.targetY <= box.height;
    pointer.targetAmt = inside ? 1 : 0;
  };
  const onPointerLeave = () => (pointer.targetAmt = 0);
  const followPointer = options.pointer && !reduced && !coarse;
  if (followPointer) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
  }

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stop();
    for (const callback of lostCallbacks) callback();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  void document.fonts.ready.then(() => {
    if (!destroyed) measureClear();
  });
  resize();

  return {
    set(next) {
      Object.assign(state, next);
      if (!running) draw();
    },
    draw,
    destroy() {
      destroyed = true;
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (followPointer) {
        window.removeEventListener("pointermove", onPointerMove);
        document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      }
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    onFirstFrame(callback) {
      if (drewFirst) callback();
      else firstFrame.push(callback);
    },
    onLost(callback) {
      lostCallbacks.push(callback);
    },
  };
}
