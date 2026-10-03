# Design system

The site's visual language follows the 2026 brand guide
(`docs/brand/source/brand-guidelines.pdf`) and the website's partner page
([website_new#257](https://github.com/tum-ai/website_new/pull/257)): dark
indigo bands with the large logomark as a background shape, big light-weight
Manrope headlines with tight tracking, thin rules, rounded photography, and
calm light bands for reading. Motion is small, purposeful and always optional.

- Components: `src/components` (import from `@tum.ai/ui-kit` only)
- Tokens: `src/styles/tailwind.css`
- Live reference: Storybook (`bun run dev`, or a hosted build of the explorer)
- Brand usage: [brand guide](brand.md)
- Base UI supplies interaction semantics; CSS cascade layers keep tokens and component overrides predictable. See [portability decisions](portability.md).

Applications compose these components and own their route-specific styles and content. The kit contains no CMS or page-only effects.

## Principles

1. **Precise, calm, alive.** Use generous whitespace, strong hierarchy and a
   few confident moves per section. Motion should support the content and
   never decorate for its own sake.
2. **Brand colors only.** Use violet, dark purple, dark indigo, black, lavender
   tint, minimal grey, white, and the tonal steps derived from them. Never give
   individual items their own accent color, and never use stock Tailwind grays
   or purples.
3. **Bands, not boxes.** A page is a sequence of full-bleed tone bands. Most
   separation comes from contrast between bands, spacing and hairlines, not
   from outlines.
4. **Accessible by default.** Base UI supplies behavior. Every text/background
   pair meets WCAG AA. Every animation respects `prefers-reduced-motion`.
   Server-rendered content is visible without JavaScript.

## Tones

Wrap each band in `<Section tone="…">`. It sets semantic tokens that every
component reads, so the same card works on light and dark bands.

| Tone       | Canvas                      | Use for                            |
| ---------- | --------------------------- | ---------------------------------- |
| `paper`    | #FFFFFF                     | Default reading band               |
| `mist`     | #EFEFEF (Minimal Grey)      | Alternate light band               |
| `lavender` | #F5EFFF (Lavender Tint)     | Soft emphasis, forms, FAQs         |
| `ink`      | #1B0049 (Dark Indigo)       | Heroes, feature bands, CTAs        |
| `night`    | #0D0214 (Black)             | Deep contrast bands, footer        |
| `violet`   | #9A64D9 (Electric Lavender) | Large type only (stats); sparingly |

Semantic utilities (resolve per tone):

| Utility                                        | Meaning                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bg-canvas` / `bg-raised` / `bg-sunken`        | Band, one step up (cards), one step down (placeholders)                             |
| `text-fg` / `text-fg-muted` / `text-fg-subtle` | Primary, secondary, meta text                                                       |
| `border-hairline` / `border-hairline-strong`   | Dividers and borders                                                                |
| `text-highlight`                               | AA-safe accent color for emphasis, links and markers (eyebrows use `text-fg-muted`) |
| `bg-fg/[0.07]` etc.                            | Tone-aware tints (works on light and dark)                                          |

Raw scales exist for rare cases: `violet-50…950` (500 = #9A64D9,
800 = #523573, 950 = #1B0049) and `ink-50…950` (violet-tinted neutrals).
`bg-indicator` (`--color-indicator`, violet-400) is the live and active dot:
`StatusBadge` `live`, the active nav item, a live count. It reads on
dark and light bands alike.

Custom utilities (`@utility` in `src/styles/tailwind.css`): `grain` (film grain on dark
bands), `zoom-media` (the one hover zoom for card media; put `group/zoom` on the
element whose hover starts it), `pressable` and `hover-lift` (the press and card-lift recipes, see [recipes](#recipes)), `scroll-mt-header` (anchor targets land below
the fixed header), `tabular`, `mask-fade-x`, `rounded-signature`,
`text-gradient-brand`.

Custom variant: `card-hover:` applies while the enclosing card (`group/card`),
link or button is hovered (on devices that can hover) or has keyboard focus. `IconBadge interactive`
uses it, so a badge reacts inside any clickable surface without a group name.

## Typography

Use Manrope only. Pick a visual size independently of the heading level.

| Utility                                  | Size                | Use                                                                                     |
| ---------------------------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `text-display-2xl`                       | up to 128px         | Home hero only                                                                          |
| `text-display-xl`                        | up to 100px         | Page heroes                                                                             |
| `text-display-lg`                        | up to 72px          | Big section statements, CTAs                                                            |
| `text-display-md`                        | up to 54px          | Section titles (default `SectionHeader`)                                                |
| `text-heading-lg` / `-md` / `-sm`        | 34 / 23 / 17px      | Card and sub-section titles                                                             |
| `text-display-fit`                       | up to 72px          | `PageHero size="fit"`: display-lg capped so a ~10em German compound fits a phone column |
| `text-lead`                              | up to 21px          | Intros under headlines                                                                  |
| `text-label` / `text-label-sm`           | 15 / 13px           | UI labels: md (and sm) buttons and badges, logo lockups and chips                       |
| `text-body` / `text-small` / `text-meta` | 16 / 14 / 13px      | Copy, card copy, metadata                                                               |
| `text-eyebrow`                           | 14px, sentence case | Labels above headlines                                                                  |
| `text-stat-sm` … `text-stat-xl`          | 40 to 88px          | Figures in `StatGrid` and `Ledger`                                                      |

Weights follow the brand guide: display sizes and figures are Light (300),
`display-md` is Regular (400), headings are Medium (500), labels Semibold.
Labels are never set in capitals.

Components: `Display`, `Heading`, `Text`, `Eyebrow` (with an optional
`index` counter, only for sections that form a sequence), `Highlight` (`accent` or `fade`), and `Prose` (long-form
text such as the legal pages).

## API conventions

Every ds component follows these; new ones must too. They are also written at
the top of `src/components/index.ts`, which wins if the two disagree.

- **Variants** are cva variants with `defaultVariants`, documented on the cva
  config. A variant that swaps the markup rather than classes may branch in
  JSX instead.
- **`as` vs `headingAs`.** `as` is the root element (Section, Container,
  Reveal, typography). `headingAs` is the level of a component's title (`h2`,
  `h3`, `h4`); the page hero owns the `h1`. `SectionHeader` takes `headingAs`
  (it used to take `as`).
- **`tone` vs `emphasis`.** `tone` only ever means a band tone (`data-tone`:
  paper, mist, lavender, ink, night, violet). A text color within a tone is
  `emphasis` (`Text`, `TextLink`).
- **Props** extend `ComponentProps<…>` of the root element, so `ref` is a plain
  prop (React 19). Every component exports its `XProps` type.
- **Styling hooks.** `className` targets the root; components with several
  parts take a `classNames` object of per-part overrides.
- **Names that collide with HTML attributes are avoided.** The line under a
  name on `QuoteCard` and `PersonCard` is `byline` (it used to be `role`, which
  clashed with the root's ARIA `role`).
- **TSDoc** on every export and every prop. A renamed prop keeps a
  `@deprecated` alias that names its replacement for one release, then goes.
- **`"use client"`** only where the component itself uses state, effects or
  event handlers; Base UI parts are client components already.
- **Motion:** the duration tokens (`duration-press` … `duration-entrance`),
  house easing (`ease-brand`), at most 1.2s outside ambient loops, and nothing
  moves under `prefers-reduced-motion` (`motion-safe:` or `motion-reduce:`).
  See [motion rules](#motion-rules); `tumai/motion-tokens` lints them.
- **Links go through `Anchor`:** routes use next/link; http(s) opens a new
  tab with `rel="noopener noreferrer"` and a screen-reader hint; mailto:, tel:
  and in-page anchors stay plain `<a>`. `ButtonLink`, `TextLink` and
  `LogoTile` link through it. **Images** use next/image; absolute remote URLs
  default to `unoptimized` (see [media](components/media.md)).
- **Imports:** component files import only sibling component files and `../lib/cn`, through relative paths.

A change to a component is done when the component, its colocated test, its
Storybook showcase entry (the catalog coverage test fails on a missing export) and its entry in the generated [API reference](api.md) agree. The `ds-component` skill
walks through it.

## Components

Layout

- `Container`: sizes `default` (80rem), `wide`, `narrow`, `prose`.
- `Section`: props `tone`, `spacing` (`sm`–`xl`), `grain` (dark bands). Give it an `id` and `aria-labelledby`.
- `SectionHeader`: `eyebrow`, `index`, `title`, `count` (a small "(4)" after the title), `lead`, `actions`, `layout` (`split` | `stack` | `center`), `size` (`md`, `lg`, or `xl` for a page's lead statement) and `headingAs`. Reveals on scroll.

Page patterns

- `PageHero`: every page starts with one: a flat ink band (no aurora or grain). It accepts `eyebrow`, `title` (strings rise in word by word, and `<Highlight>` parts work), `lead`, `actions`, an optional `media` column, `children` (for stats or filters under the headline) and `classNames` slots. `emphasis="highlight"` sets the whole title in the tone's accent, as on the brand guide's section slides; keep the default when the title marks words with `<Highlight>`. `size="fit"` caps the title for long single words. It clears the fixed header.
- `CtaBand`: closing call to action on flat ink (no aurora or grain). `variant="panel"` is an inset ink panel; `variant="band"` is full bleed. `mark={false}` drops the drifting logomark when `visual` is the band's artwork. Takes `children` and `classNames.footer`.
- `FaqSection`: sticky heading beside an accordion, with `defaultValue` (questions that start open). No eyebrow by default. `FaqList` renders the accordion on its own (one answer open at a time) and takes `defaultValue` too, or `value` with `onValueChange` when a parent reacts to the open question. An item with an `id` is deep-linkable: a link to `#id` opens it, on load and on later fragment changes.
- `Steps`: a numbered process, with `rail` (`solid`, `dashed`, `none`), `marker` (`badge`, `dot`), an optional per-step `number` (e.g. "02A") and a `detail` line under the title (such as the step's dates). `layout="rows"` sets each step as a hairline row with the number beside it, for steps that are sentences.
- `StatGrid`: numeric values count up when they scroll into view (sizes `sm`–`xl` on the `text-stat-*` tokens); strings render as they are, or count with `count`.
- `Ledger`: key figures as an annual-report ledger, one hairline row per figure with its label and a `note` on the left and the figure right-aligned (`size` `md` or `lg`). Same figure rules as `StatGrid`.
- `KeyDates`: a round's important dates as a call for papers sets them. One hairline row per date, the label (and a `detail` line) on the left and the date in light figures on the right. Each row's `state` (`past`, `next`, `upcoming`) comes from the caller's own clock: past dates are struck through and say "(passed)" to screen readers, and the next one is in the accent with its `note`. `size` `md` or `lg`; `drawIn` draws the strikes once on load (above the fold).
- `DayRuler`: a window of days as a ruler, with one tick per day, taller week ticks, and a fill and mark up to today (`days`, `elapsed`, optional `startLabel`, `endLabel` and a `markLabel` over today's mark, `size` `md` or `lg`, `drawIn`). It is decorative, so say the same thing in text beside it ("26 days left").
- `IndexList`: a typographic index of destinations. Full-width link rows (large light title, one line of description, optional `detail`, an arrow); from `lg` a sticky photo beside the list follows the hovered or focused row, and the other rows recede: muted titles, faded arrows and thumbnails, descriptions at full contrast. Below `lg` each row shows its photo as a thumbnail; a title word wider than the column beside it breaks onto the next line rather than running under the thumbnail.
- `BrandPanel`: the branded placeholder for a missing image.
- `TopBlend`: eases a dark band's edge into the root canvas (see [browser-quirks.md](browser-quirks.md)).

Actions

- `ButtonLink`: for navigation. Uses next/link internally; external links open in a new tab and say so. Variants: `primary` (a flat violet-600 fill with a hairline highlight, no glow), `secondary`, `outline`, `ghost`, `inverse` (white on dark), `link`. Sizes: `sm`, `md`, `lg`. `arrow` takes `true`, `"external"` or `"down"`.
- `Button`: for actions (Base UI). Compose it into triggers with `render={<Button variant="outline" />}`.
- `Actions`: the row for two or more buttons or badges (`align`: `start` | `center`). On one line each item keeps its width; once the row wraps on a phone, every item grows to the row width, so stacked actions share one width. `PageHero`, `CtaBand` and `SectionHeader` use it for their `actions`.
- `IconButton`: requires `aria-label`.
- `TextLink`: inline link with an underline that draws in on hover.
- `Anchor`: the unstyled, route-aware link every ds link builds on; use it directly for links that bring their own styling (navigation lists, the footer).

Content

- `SpotlightCard`: a card whose light follows the pointer. Variants `raised`, `outline`, `glass`, `plain`, a `padding` step, and `interactive` (a 4px lift on hover) when the card is a link.
- `IconBadge`: an icon in a tinted brand-violet tile (decorative). `interactive` reacts to the enclosing card, link or button (`card-hover:`).
- `FallbackImage`: next/image that swaps to a fallback when it fails to load.
- `QuoteCard` (`raised` or `glass`, with `context` and `footer` slots; `editorial` sets one quote in display type without a card; `ruled` sets quotes in a list under a hairline, without a card) and `QuoteMark`.
- `Photo`: a documentary photo in the brand frame with a factual `caption` (a `figure`). `aspect` (`3/2` default, `4/3`, `16/10`, `4/5`, `1/1`, and `panorama` for wide group shots: 4/3, then 2/1 from `sm` and 24/7 from `lg`), `shape` (`rounded` = `rounded-4xl`, or `bleed`), `position` for the crop, and `eager` for the LCP photo (high fetch priority, no preload tag). Use it instead of hand-rolled image frames.
- `PersonCard`: portrait, name and `byline`; `image.position` keeps a face in frame, and `unoptimized` serves the portrait as is.
- `LogoTile`, `LogoWall`: logos as tiles (`size` `sm` to `xl`, `responsive` for one step smaller on phones), `variant="chip"` (with `fixed` width so rows don't reflow), `variant="bare"` for artwork made for dark bands, `variant="mono"` for light-background artwork in greyscale on light bands, links, or a `wordmark` lockup, with a name fallback when the artwork fails. `LogoWall layout="strip"` sets `mono` logos in one wrapping row, each sized to the same area from its `aspectRatio`.
- `BulletList`: a short list of points as raised rows with an accent dot (for example inside an FAQ answer).
- `Pill`: outlined brand pill.
- `Tag`: keyword chip.
- `StatusBadge`: `live` (pulsing dot), `idle` or `closed`. Its `size` (`sm`, `md`, `lg`) matches button heights; always pair it at the same size as the button beside it. A label too long for a narrow phone wraps into a rounded rectangle, centred, with the dot on its first line.
- `EmptyState`.

Interactive (Base UI)

- `Accordion` / `FaqList`: panels use `hidden="until-found"` so find-in-page still works. `FaqList` is a client island (it listens for the URL fragment); the `Accordion` parts stay server-renderable.
- `Dialog`, `DialogTrigger`, `DialogContent` (`variant` `modal` or `fullscreen`, `size` `md`, `lg` or `xl`, `tone`), `DialogTitle`, `DialogDescription`, `DialogClose`. An open dialog makes the page inert (`useInertBackground`).
- `Collapsible`, `CollapsibleTrigger`, `CollapsiblePanel`.
- `ChipGroup`: single-select filter chips, with optional counts.

Motion

- `Reveal`: fades content in on scroll. Variants: `up`, `fade`, `scale`, `left`, `right`, `line`. Use `delay={i * 80}` to stagger.
- `SplitWords`: headline words rise in on load; animated with CSS only.
- `CountUp`: parses formatted strings such as "1.2M+"; `parseFigure` and `formatFigure` are the server-safe helpers.
- `MotionProvider`: framer-motion's `LazyMotion strict`, rendered once in the application's root layout.
- `BrandMark`: the logomark as a tonal background shape, with an `intensity` step for dark bands. Use it as decoration only, never as a logo substitute.
- `Aurora`: slow light field for dark bands.

## Motion rules

Motion is small, crisp and never bouncy: one move per interaction. Every interactive surface answers the pointer and the keyboard, and state changes transition instead of snapping.

### Tokens

| Duration            | Value  | Use                                                                                                            |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `duration-press`    | 150ms  | The press itself (`pressable`)                                                                                 |
| `duration-hover`    | 300ms  | Colour, tint and opacity responses to hover and focus, and exits (`data-[ending-style]:duration-hover`)        |
| `duration-surface`  | 500ms  | Anything that travels or draws (arrow nudges, underline draws, icon turns, the card lift), panels and overlays |
| `duration-media`    | 700ms  | Image crossfades, staggered menu items                                                                         |
| `duration-entrance` | 1000ms | Transition-based arrivals; the keyframe entrances (`rise`, `fade`, `draw`, `Reveal`) run 0.8–1.1s              |

Easings: `ease-brand` (`cubic-bezier(0.22,1,0.36,1)`) everywhere, `ease-snappy` for full-screen slides and `ease-in-out-soft` for ambient loops. A bare `transition-*` utility already uses `duration-hover` and `ease-brand`. Raw milliseconds, other easings and `transition-all` fail lint (`tumai/motion-tokens`, which also autofixes `duration-300` and friends to their names). `motion-reduce:duration-0` stays allowed as an opt-out.

### Recipes

- `pressable`: a 3% shrink while pressed, for anything clickable. The press takes `duration-press` and the release eases back at the element's own duration. List `scale` in the element's transition (lint checks it).
- `hover-lift`: the 4px card lift on hover and on keyboard focus of the card or of a link or button inside it. List `translate` in the element's transition (lint checks it).
- `zoom-media`: the slow 1.04 image zoom inside a `group/zoom` card, on hover and on keyboard focus of the card or of a link or button inside it.
- `card-hover:`: a variant (not motion) for parts that react while the enclosing card, link or button is hovered (on devices that can hover) or has keyboard focus, on itself or on a link or button inside it. Gate any transform inside it with `motion-safe:`.

`pressable`, `hover-lift` and `zoom-media` do nothing under reduced motion, and the hover parts do nothing on touch-only devices.

### Micro-interaction contract

Every interactive element has these states, built from the tokens and recipes above:

- **Hover** (on devices that can hover): a colour, tint or underline response at `duration-hover`, or a small move (an arrow nudge, the lift) at `duration-surface`.
- **Focus-visible:** the global focus ring, plus the same response as hover where hover moves something (lift, nudge, the header pill).
- **Press:** `pressable`, or a fill change for controls that toggle.
- **Disabled:** dimmed, with no hover or press response.
- **Open and close** for overlays and panels: an entrance at `duration-surface` and an exit that is faster than the entrance (`data-[ending-style]:duration-hover`).
- **State changes** (selected, expanded, counted) transition; they don't snap.

Under reduced motion nothing animates: transforms are gated by `motion-safe:` (they don't happen) or `motion-reduce:transition-none` (they happen instantly), and colour responses stay. Prefer `motion-safe:` for anything that travels.

### Rules

- Above the fold, use the CSS utilities (`motion-safe:animate-rise`, `-rise-sm`, `-fade`) or `SplitWords`. Never use `Reveal` there: it waits for hydration.
- Below the fold, use `Reveal`. Only elements that start below the viewport are hidden, so server-rendered HTML and no-JS visitors always see content.
- Move things only with `transform` and `opacity`; colours may fade, and a disclosure's height is the one layout animation. A size or position utility that transitions on interaction must be gated for reduced motion like a transform (lint checks it). Avoid `filter` on anything containing text or large areas: Safari clips filtered elements to their box (cutting descenders) and large blurs stutter on phones. Any filter must be released when the animation ends. A short blur on logo images (not text) is fine: a logo wall may blur the outgoing and incoming artwork through a swap. Filters transitioned on interaction fail lint (`tumai/no-filter-motion`).
- Prefix every looping or entrance animation with `motion-safe:`, and gate every transform that responds to interaction (`motion-safe:hover:…`, or `motion-reduce:transition-none` on the same element). Lint enforces both.
- Hover effects stay small: slow image zoom (1.04, `zoom-media`), arrow nudges, a 4px card lift, spotlight. Nothing bouncy.
- framer-motion runs inside `LazyMotion strict`: import `m`, not `motion`.

## Composition rules

These come from design review. Treat them as hard rules.

- **No meta rows.** Don't put a row of small labels between hairlines above hero headlines or sections.
- **Nested corners:** never set a rounded image or tile against a straight divider or straight edge inside a card. Either let the media bleed to the card edge, where the card's outer radius clips it and its inner edges stay straight, or inset it evenly on all sides with inner radius = outer radius − inset.
- **Alignment:** within a panel, labels, titles and controls share one baseline or grid. Icons are optically centered on the text they label. Never nudge them by hand.
- **Equal heights:** a button and a badge or chip placed side by side use the same size step.
- **Equal widths when stacked:** group actions in `Actions`, never a bare `flex flex-wrap` row, so buttons that stack on a phone line up at one width.
- **No redundant labels:** if a logo already shows the name (a wordmark), don't repeat the name next to it. Symbol-only logos get the name inside the chip as a lockup, and only information the logo lacks sits outside it.
- **Don't combine `hyphens: auto` with `SplitWords` headlines:** each word is its own box, so hyphenation strands syllables. Size the headline down instead.
- **No em dashes in visible copy.** Use a comma, colon, period or a spaced hyphen instead. The same goes for separators in labels.

## Accessibility rules

- One `<main>` per page. It is the page module's root element, and the layout provides the skip link target.
- Heading order: the `PageHero` is the `h1`, section titles are `h2`, card titles are `h3`.
- Use Base UI components for anything interactive. Never make a `<div>` clickable.
- Images need meaningful `alt` text; decorative images get `alt=""`. Links that open a new tab announce it; `Anchor`, and everything built on it (`ButtonLink`, `TextLink`, `LogoTile`), does this for you.
- Focus rings are global (3px violet with an offset). Don't remove them.

## Page anatomy

A typical public page composes PageHero, alternating Section bands, an optional FaqSection, CtaBand and the night Footer. These are patterns, not restrictions on application structure. End on light or ink when using the night footer. Application-specific content and campaign scheduling belong to the consumer.

## Package constraints

The consumer supplies all facts, navigation and images. Configure Next remotePatterns before opting into optimized remote images. Core styles have zero header offsets; shell.css adds the floating-header contract. See portability.md and testing.md.

## API reference

Component prop tables are generated by Storybook from TypeScript and TSDoc. See docs/api.md for the generated export inventory. Application facts and route-specific page composition belong to the consumer.
