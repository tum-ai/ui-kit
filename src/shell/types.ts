import type { ImageProps } from "next/image";

/** Caller-owned navigation entry used by the reusable shell. */
export type NavLink = {
  /** Internal route, fragment, http(s), mailto: or tel: destination. */
  href: string;
  /** Visible and accessible link label. */
  label: string;
  /** Override automatic new-tab behavior for http(s) destinations. */
  external?: boolean;
};

/** Branding image supplied by the application, rendered with Next Image. */
export type ShellLogo = {
  /** A URL or static Next Image import owned by the caller. */
  src: ImageProps["src"];
  /** Intrinsic image width in pixels. */
  width: number;
  /** Intrinsic image height in pixels. */
  height: number;
  /** Meaningful alternative text, or empty when the surrounding link names the image. */
  alt: string;
  /** Serve the original image directly; useful for remotes the caller has not optimized. */
  unoptimized?: boolean;
};
