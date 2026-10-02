# Composition and motion components

These components provide page-level composition and motion. Application content, dates, counts, links and state stay in the
consumer. Import runtime components from `@tum.ai/ui-kit` and load the kit's
Tailwind stylesheet in the consumer application.

## Page composition

| Component       | Main choices                                                                                                 | Contract                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PageHero`      | `size`: `fit`, `md`, `lg`, `xl`; `tone`: `ink`, `night`; `emphasis`: `default`, `highlight`                  | Owns the page's `h1`; `titleId` labels the band. The title, lead, actions, media and footer use CSS entrances above the fold.                              |
| `SectionHeader` | `layout`: `split`, `stack`, `center`; `size`: `md`, `lg`, `xl`                                               | Opens a section with a title, optional eyebrow, count, lead and actions. Set `headingAs` independently of visual size and use `id` to label its section.   |
| `CtaBand`       | `variant`: `panel`, `band`; surrounding `tone` for the panel                                                 | The inset panel and full band use ink. `mark={false}` makes room for caller artwork. `children` and `classNames.footer` support content below the actions. |
| `FaqSection`    | `tone`, `title`, `lead`, `aside`, `defaultValue`                                                             | A section title and sticky introduction beside a `FaqList`. The section's `id` produces the title id automatically.                                        |
| `Steps`         | `layout`: `columns`, `rows`; `rail`: `solid`, `dashed`, `none`; `marker`: `badge`, `dot`; `columns`: 3, 4, 5 | An ordered list. Rows ignore columns, rail, marker and icons. A step can supply `number`, `detail` and a stable `id` for a markup title.                   |

`PageHero`, `SectionHeader` and `CtaBand` wrap supplied actions in `Actions`, so
buttons keep equal widths when they stack. Their `classNames` slots preserve the
existing typography and spacing while allowing consumer overrides.

```tsx
import { ButtonLink, PageHero, Section, SectionHeader } from "@tum.ai/ui-kit";

<PageHero
  titleId="example-title"
  title="Build a shared possibility"
  lead="Start with a clear question and a different perspective."
  actions={<ButtonLink href="#examples">Explore examples</ButtonLink>}
/>
<Section tone="paper" aria-labelledby="examples-title">
  <SectionHeader id="examples-title" title="Example projects" count={4} />
</Section>
```

## Figures and time windows

`StatGrid` uses definition-list semantics, with `columns` 2, 3 or 4 and `size`
`sm` through `xl`. `Ledger` provides hairline rows with a label, optional `note`
and a right-aligned figure, in `md` or `lg` size. Numbers count on scroll;
strings stay exactly as supplied unless `count` is true. `prefix`, `suffix`,
`decimals` and `grouping` format numeric values. `StatFigure` is an internal
module helper shared by the two components, rather than a public kit export.

`CountUp` accepts a numeric value or one formatted copy figure, for example
`"1.2M+"`, `"€4.5M"` or `"2,100+"`. The server renders the final figure and screen
readers always receive it. Content already in view and reduced-motion visitors
keep that final figure. Below the fold, the visual copy counts once on entry
and settles on the exact supplied string. `duration` is in seconds, with the
source default of 1.2 seconds.

The server-safe helpers `parseFigure` and `formatFigure` live outside the client
module. Parsing returns a `ParsedFigure` with prefix, numeric value, decimal
precision, grouping and suffix. A range or ambiguous copy such as `"24/7"`
returns `null`. Formatting uses the same shape with English numeric separators.

```tsx
import { CountUp, formatFigure, parseFigure } from "@tum.ai/ui-kit";

const shape = parseFigure("€12,345.60M+");
const half = shape ? formatFigure(shape.value / 2, shape) : "Unavailable";
// half is "€6,172.80M+".
<CountUp value={2100} prefix="~" suffix="+" />;
```

`KeyDates` is a definition list in `md` or `lg` size. The caller supplies each
row's `state`: `past`, `next` or `upcoming`. Passed dates receive a decorative
strike and a screen-reader suffix; only the next date shows its `note`.
`dateTime` provides a machine-readable value for the `<time>` element.
`drawIn` optionally draws past-date strikes above the fold and respects reduced
motion. The component has no clock and never derives status from the current
date.

`DayRuler` takes `days` and `elapsed` as whole-day counts. It draws a tick for
each midnight, longer weekly ticks, a progress fill and a mark. Values outside
the window clamp to the ends. Its optional start, end and mark labels are
also decorative: repeat the useful information in adjacent accessible text.
`size` is `md` or `lg`; `drawIn` is an optional CSS entrance.

```tsx
import { DayRuler } from "@tum.ai/ui-kit";

<p>20 days remain in this example window.</p>
<DayRuler days={28} elapsed={8} markLabel="20 days remain" />
```

## FAQ state and links

`FaqList` renders one open answer at a time. Each question is a unique item
value; `defaultValue` is an array of question strings. For controlled state,
pass `value` and `onValueChange`. `headingAs` defaults to `h3`. Answers accept
React content, including paragraphs and links.

An item's stable `id` makes it deep-linkable. A link to `#id` opens that item
on mount and on later fragment changes, including percent-encoded ids. The
question returns to view after the previous panel collapses. Invalid or
unrelated fragments leave the reader's current state unchanged; re-rendering
does not reopen an answer the reader has closed. All answers remain in server
HTML, and `defaultValue` opens the requested answer there. Base UI's server
markup uses the ordinary `hidden` attribute for closed panels; after hydration,
closed answers use `hidden="until-found"` for find-in-page support. Find-in-page
revelation of a closed answer therefore requires hydration.

```tsx
import { FaqList } from "@tum.ai/ui-kit";

<FaqList
  items={[
    { id: "example-details", question: "Where are the details?", answer: "Here." },
    { id: "example-next", question: "What comes next?", answer: "Choose a question." },
  ]}
  defaultValue={["Where are the details?"]}
/>;
```

## Optional motion

`Reveal` uses `up`, `fade`, `scale`, `left`, `right` or `line`, with a millisecond
`delay`. It is polymorphic through `as` and forwards the React 19 ref prop.
Server content has an idle state and remains visible without JavaScript. Only
content that starts below the viewport is hidden after hydration, and it
reveals once. Reduced motion leaves content visible. Above the fold, use
`SplitWords` or the CSS entrance utilities instead.

`SplitWords` is server-compatible and uses CSS only. Text splits into individual
word boxes, fragments flatten, and a markup element such as `Highlight` moves
as a single unit. `delay` and `step` are milliseconds. Its animation classes
apply only when motion is allowed. Never combine split-word headlines with
automatic hyphenation; use `PageHero size="fit"` for long words.

`MotionProvider` is a supporting export. Wrap the consumer application once
in it to supply framer-motion's strict `LazyMotion` boundary and the visitor's
reduced-motion setting. Use `m` components within that boundary. The Reveal
stories show this composition; no separate visual placeholder is needed.

## Portability and verification

Runtime imports use sibling components and `../lib/cn`, with no application
alias, CMS, config or feature dependency. Initial FAQ fragment
synchronization runs in a cancellable microtask after the mount effect, so it
remains an enhancement after server rendering and complies with the
React effect rules. Later fragment changes still synchronize through the browser
event. Client/server boundaries, semantic markup, motion behavior and
visual classes are retained.
Stories use deterministic sample content and the local
`/assets/placeholder.svg` fixture. Their tone metadata describes the supported
band values, and named variants demonstrate long content, real composition
choices and FAQ interaction.

Colocated source tests are retained, with figure parsing moved into a pure unit
test alongside formatting checks. Additional tests cover actual server HTML,
fragment decoding, unrelated fragments, split-word content and the supporting
motion boundary. Storybook plays exercise keyboard FAQ interaction, controlled
state, rendered fragment targets and the component's hash-change subscription.
The fragment play changes the current tester URL through the History API and
dispatches a `HashChangeEvent`, preserving the browser test connection. Native
fragment-link navigation belongs to the static explorer's Playwright checks. Real-browser accessibility and reduced-motion verification
remain part of the repository's full acceptance command.
