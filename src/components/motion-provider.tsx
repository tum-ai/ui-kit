"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Props for {@link MotionProvider}. */
export type MotionProviderProps = {
  /** The app (the site layout wraps everything in it). */
  children: ReactNode;
};

/**
 * Site-wide motion settings; the (site) layout renders it once.
 * `LazyMotion strict` keeps framer-motion's bundle small: use `m.*`
 * components (not `motion.*`) inside the app. Transform and layout animations
 * respect the visitor's reduced-motion preference.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
