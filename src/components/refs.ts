/*
 * Ref helpers for client components. Not exported from the barrel.
 */

import { type Ref, type RefCallback, useCallback } from "react";

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") {
    const cleanup = ref(node);
    return typeof cleanup === "function" ? cleanup : () => ref(null);
  }
  if (ref) {
    ref.current = node;
    return () => {
      ref.current = null;
    };
  }
  return undefined;
}

/**
 * One callback ref that feeds a component's own ref and the `ref` prop a
 * caller passed (React 19 passes refs as props). Stable while both are.
 */
export function useComposedRef<T>(
  own: Ref<T> | undefined,
  forwarded: Ref<T> | undefined,
): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      const cleanups = [assignRef(own, node), assignRef(forwarded, node)];
      return () => {
        for (const cleanup of cleanups) cleanup?.();
      };
    },
    [own, forwarded],
  );
}
