"use client";

/*
 * The scroll-triggered entrance shared by Reveal and DayRuler, for client
 * components. Not exported from the barrel.
 */

import { type RefObject, useEffect, useState } from "react";

import { prefersReducedMotion } from "./internal";

/**
 * Where an entrance stands: `idle` (server HTML, content that started on
 * screen, reduced motion; nothing hidden), `pending` (below the fold, held
 * at its start frame) or `done` (scrolled into view, entering).
 */
export type EntranceState = "idle" | "pending" | "done";

/* One shared observer for every entrance on the page. */
const listeners = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function observe(node: Element, onEnter: () => void) {
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        listeners.get(entry.target)?.();
        listeners.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  listeners.set(node, onEnter);
  sharedObserver.observe(node);
  return () => {
    listeners.delete(node);
    sharedObserver?.unobserve(node);
  };
}

/**
 * The entrance of the element in `ref`, run once. It stays `idle` when the
 * element starts on screen, under reduced motion and while `enabled` is
 * false; otherwise it turns `pending` after hydration and `done` the first
 * time the element scrolls into view.
 */
export function useEntrance(ref: RefObject<Element | null>, enabled = true): EntranceState {
  const [state, setState] = useState<EntranceState>("idle");

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    if (prefersReducedMotion()) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.94) return;

    setState("pending");
    return observe(node, () => setState("done"));
  }, [ref, enabled]);

  return state;
}
