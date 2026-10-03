# @tum.ai/ui-kit

## 0.2.0

### Minor Changes

- b4e49f3: Add `@tum.ai/ui-kit/halftone` with `HalftoneField` (a WebGL2 halftone dot field with a CSS fallback) and `Sun`, plus `@tum.ai/ui-kit/halftone.css` with their styles and the sun ramp (`--sun-100` to `--sun-900`). Both are opt-in and work without the kit's Tailwind theme. Moved here from the Makeathon site.
- 06a13f8: Make interactions feel consistent across the kit.

  - Filled and outlined buttons, filter chips, linked logo tiles, the dialog close button and the header's menu buttons share one press response (`pressable`: a 3% shrink while pressed, none under reduced motion). `Button variant="link"` doesn't shrink, like `TextLink`.
  - Keyboard focus now gets the same move as hover: Button and `TextLink` arrows, `IndexList` rows, the mobile menu's item arrows and hamburger, the rotating close buttons, `card-hover:` (so `IconBadge interactive` reacts to a focused card) and `zoom-media`.
  - An `Accordion` answer fades with its height and closes a little faster (300ms instead of 500ms). The fade sits on the panel, so a find-in-page match shows at once. The open/close icon shrinks slightly while pressed.
  - `Prose` thickens only the hovered link's underline, with a short transition; before, hovering anywhere in the text thickened every link.
  - `Eyebrow` with an `index` reads "03, Projects" to screen readers instead of "03Projects".

- 06a13f8: Add a motion scale and two motion recipes to `tailwind.css`.

  - Duration tokens: `duration-press` (150ms), `duration-hover` (300ms), `duration-surface` (500ms), `duration-media` (700ms) and `duration-entrance` (1000ms). `cn` merges them like Tailwind's own durations, and now also knows `animate-draw`.
  - `pressable` (a 3% shrink while pressed, landing in `duration-press`) and `hover-lift` (the 4px card lift, now also on keyboard focus of the card or a link or button inside it).
  - A bare `transition-*` utility now defaults to 300ms with the house easing instead of Tailwind's 150ms. Apps that import the kit's styles get the same default.
  - Reduced motion: the `SpotlightCard` pointer light no longer fades, and the header's menu icon no longer nudges or grows (its second bar now scales instead of animating its width).

- 06a13f8: Tighten the published types and docs under stricter TypeScript and lint rules. `DayRuler` has its TSDoc description again, and API reference links now name their target.

  **Breaking (types only):** `LogoTileProps` no longer accepts `aspectRatio`. A tile never read it; only `LogoWall`'s `strip` layout does. Migration: remove `aspectRatio` from `<LogoTile>`, and keep it on the `LogoItem`s you pass to `LogoWall`.

### Patch Changes

- 06a13f8: Give the last controls without a hover state one, and fix chip contrast on the violet tone.

  - A selected `ChipGroup` chip softens its fill slightly on hover (staying above 4.5:1 on every tone). Its count badge is now an inverted pill (canvas fill, foreground text), which also fixes the badge's contrast on the violet tone.
  - The `Header` logo link gets the same soft tint as the navigation pill on hover.
  - The `SkipLink` tints on hover, and slides in at 300ms with the house easing instead of Tailwind's default 150ms.
