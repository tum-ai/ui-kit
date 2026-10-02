import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType } from "react";

import { cn } from "../lib/cn";
import type { BlockElement, PolymorphicProps } from "./types";

const containerStyles = cva("mx-auto", {
  variants: {
    /** Maximum width of the column; the gutters are the same for all. */
    size: {
      /** Site grid: 80rem max, same gutters as the partner page. */
      default: "w-[min(80rem,calc(100%-2*var(--gutter)))]",
      wide: "w-[min(90rem,calc(100%-2*var(--gutter)))]",
      narrow: "w-[min(60rem,calc(100%-2*var(--gutter)))]",
      /** Long-form reading measure. */
      prose: "w-[min(46rem,calc(100%-2*var(--gutter)))]",
    },
  },
  defaultVariants: { size: "default" },
});

/** Props for {@link Container}: the root element's props plus `size`. */
export type ContainerProps<T extends BlockElement = "div"> = PolymorphicProps<
  T,
  VariantProps<typeof containerStyles>
>;

/** Horizontally centered content column with responsive gutters. */
export function Container<T extends BlockElement = "div">({
  as,
  size,
  className,
  ...props
}: ContainerProps<T>) {
  // Widened on purpose: narrowed to `T`, JSX would intersect every root's props.
  const Component = (as ?? "div") as ElementType;
  return <Component className={cn(containerStyles({ size }), className)} {...props} />;
}
