"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Props for {@link MotionProvider}. */
export type MotionProviderProps = {
  /** The application content; render the provider once in the root layout. */
  children: ReactNode;
};

/**
 * Application-wide motion settings; render it once in the root layout.
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
