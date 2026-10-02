/**
 * TUM.ai design system. Usage, tokens and rules: docs/design-system.md.
 * Interactive primitives are built on Base UI (@base-ui/react); styling is
 * Tailwind against the tone tokens in src/styles/tailwind.css. Import from this
 * barrel only; the files behind it are private.
 *
 * API conventions (every component follows them; new ones must too):
 * - Variant props are cva variants, documented on the cva config. A variant
 *   that swaps the markup rather than classes may branch in JSX instead.
 * - `as` is the root element (Section, Container, Reveal, typography).
 *   `headingAs` is the level of a component's title (`h2`/`h3`/`h4`); the
 *   page hero owns the `h1`.
 * - `tone` only ever means a band tone (`data-tone`: paper, mist, lavender,
 *   ink, night, violet). A text color within a tone is `emphasis`.
 * - Props extend `ComponentProps<…>` of the root element, so `ref` is a
 *   plain prop (React 19); every component exports its `XProps` type.
 * - Styling hooks: `className` targets the root; components with several
 *   parts take a `classNames` object of per-part overrides.
 * - Every export and prop has TSDoc. A renamed prop keeps a `@deprecated`
 *   alias that names its replacement for one release, then goes.
 * - "use client" only where the component itself uses state, effects or
 *   event handlers; Base UI parts are client components already.
 * - Motion: house easing (`ease-brand`), at most 1.2s outside ambient loops,
 *   and nothing moves under `prefers-reduced-motion` (use `motion-safe:` or
 *   `motion-reduce:`).
 * - Links go through <Anchor>: http(s) opens a new tab with
 *   `rel="noopener noreferrer"` and a screen-reader hint; routes use
 *   next/link. Images use next/image.
 */

export {
  Accordion,
  AccordionItem,
  type AccordionItemProps,
  AccordionPanel,
  type AccordionPanelProps,
  type AccordionProps,
  AccordionTrigger,
  type AccordionTriggerProps,
} from "./components/accordion";
export { Actions, type ActionsProps } from "./components/actions";
export { Anchor, type AnchorProps } from "./components/anchor";
export { Aurora, type AuroraProps } from "./components/aurora";
export { BrandMark, type BrandMarkProps } from "./components/brand-mark";
export { BrandPanel, type BrandPanelProps } from "./components/brand-panel";
export { BulletList, type BulletListProps } from "./components/bullet-list";
export {
  Button,
  type ButtonArrowKind,
  ButtonLink,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonStyleProps,
  buttonStyles,
  IconButton,
  type IconButtonProps,
} from "./components/button";
export { ChipGroup, type ChipGroupProps, type ChipOption } from "./components/chip-group";
export {
  Collapsible,
  CollapsiblePanel,
  type CollapsiblePanelProps,
  type CollapsibleProps,
  CollapsibleTrigger,
  type CollapsibleTriggerProps,
} from "./components/collapsible";
export { Container, type ContainerProps } from "./components/container";
export { CountUp, type CountUpProps } from "./components/count-up";
export { CtaBand, type CtaBandClassNames, type CtaBandProps } from "./components/cta-band";
export { DayRuler, type DayRulerProps } from "./components/day-ruler";
export {
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  type DialogDescriptionProps,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
} from "./components/dialog";
export { EmptyState, type EmptyStateProps } from "./components/empty-state";
export { FallbackImage, type FallbackImageProps } from "./components/fallback-image";
export { type FaqItem, FaqList, type FaqListProps } from "./components/faq-list";
export { FaqSection, type FaqSectionProps } from "./components/faq-section";
export { formatFigure, type ParsedFigure, parseFigure } from "./components/figure";
export { IconBadge, type IconBadgeProps } from "./components/icon-badge";
export { IndexList, type IndexListItem, type IndexListProps } from "./components/index-list";
export {
  type KeyDateItem,
  KeyDates,
  type KeyDatesProps,
  type KeyDateState,
} from "./components/key-dates";
export { Ledger, type LedgerItem, type LedgerProps } from "./components/ledger";
export {
  type LogoItem,
  LogoTile,
  type LogoTileProps,
  LogoWall,
  type LogoWallProps,
} from "./components/logo-wall";
export { MotionProvider, type MotionProviderProps } from "./components/motion-provider";
export { PageHero, type PageHeroClassNames, type PageHeroProps } from "./components/page-hero";
export { PersonCard, type PersonCardProps } from "./components/person-card";
export { Photo, type PhotoProps } from "./components/photo";
export {
  type BadgeStatus,
  Pill,
  type PillProps,
  StatusBadge,
  type StatusBadgeProps,
  Tag,
  type TagProps,
} from "./components/pill";
export {
  QuoteCard,
  type QuoteCardProps,
  type QuoteImage,
  QuoteMark,
  type QuoteMarkProps,
} from "./components/quote-card";
export { Reveal, type RevealProps, type RevealVariant } from "./components/reveal";
export { Section, type SectionProps, type Tone } from "./components/section";
export {
  SectionHeader,
  type SectionHeaderClassNames,
  type SectionHeaderProps,
} from "./components/section-header";
export { SplitWords, type SplitWordsProps } from "./components/split-words";
export { SpotlightCard, type SpotlightCardProps } from "./components/spotlight-card";
export { StatGrid, type StatGridProps, type StatItem } from "./components/stat";
export { type StepItem, Steps, type StepsProps } from "./components/steps";
export { TextLink, type TextLinkEmphasis, type TextLinkProps } from "./components/text-link";
export { TopBlend, type TopBlendProps } from "./components/top-blend";
export type { BlockElement, HeadingLevel, PolymorphicProps, TextElement } from "./components/types";
export {
  Display,
  type DisplayProps,
  Eyebrow,
  type EyebrowProps,
  Heading,
  type HeadingProps,
  Highlight,
  type HighlightProps,
  Prose,
  type ProseProps,
  Text,
  type TextEmphasis,
  type TextProps,
} from "./components/typography";
