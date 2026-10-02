import type { ComponentProps, ElementType } from "react";

/**
 * Levels a component title can render as (`headingAs`). The page hero owns
 * the `h1`; sections default to `h2` and cards to `h3`.
 */
export type HeadingLevel = "h2" | "h3" | "h4";

/**
 * Root elements for the layout family (`as` on Section, Container and
 * Reveal).
 */
export type BlockElement =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "main"
  | "nav"
  | "figure"
  | "li"
  | "ul"
  | "ol";

/**
 * Root elements for the typography family (`as` on Display, Heading, Text and
 * Eyebrow). The visual size never depends on the element.
 */
export type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "div"
  | "li"
  | "dt"
  | "dd"
  | "figcaption"
  | "label"
  | "strong";

/**
 * Own props `P` plus every prop of the rendered element `T`, including `ref`
 * (React 19 passes refs as props). `P` wins where both define a prop.
 */
export type PolymorphicProps<T extends ElementType, P = object> = P & {
  /** Root element to render. */
  as?: T;
} & Omit<ComponentProps<T>, "as" | keyof P>;
