"use client";

import Image, { type ImageProps } from "next/image";
import { type ReactNode, useState } from "react";

import { isUnoptimizedRemoteImage } from "./internal";

/** Props for {@link FallbackImage}: next/image props with an optional `src`. */
export type FallbackImageProps = Omit<ImageProps, "src" | "onError"> & {
  /** Image source. Without one the fallback renders straight away. */
  src?: ImageProps["src"];
  /** Rendered instead of the image when there is no source or it fails to load. */
  fallback: ReactNode;
  /** Called once the image has failed, before the fallback renders. */
  onError?: () => void;
};

/**
 * next/image that swaps to `fallback` when it has no source or fails to load
 * (a CMS asset that was deleted, a flaky CDN). A changed `src` gets a fresh
 * attempt instead of inheriting the previous failure. Absolute http(s) sources
 * bypass optimization by default; pass `unoptimized={false}` to opt in and
 * configure the consumer app's `images.remotePatterns`.
 */
export function FallbackImage({
  src,
  fallback,
  onError,
  unoptimized,
  ...props
}: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<FallbackImageProps["src"]>();

  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    <Image
      src={src}
      unoptimized={unoptimized ?? (typeof src === "string" && isUnoptimizedRemoteImage(src))}
      onError={() => {
        onError?.();
        setFailedSrc(src);
      }}
      {...props}
    />
  );
}
