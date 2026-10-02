---
name: tumai-brand
description: TUM.ai brand identity for the UI kit. Use whenever a change touches how anything looks, even if the brand isn't mentioned, including colors, tones and backgrounds, typography, buttons and interactive states, logos, imagery, gradients, visual copy, or a new component or pattern. Gives the palette, tone bands, type scale and logo rules from the brand guide and the live tokens.
---

# TUM.ai brand

The kit's visual system is the 2026 TUM.ai brand guide, implemented as tokens in
`src/styles/tailwind.css` and components in `src/components`. Work from those files, not from
memory. The tokens are tuned for WCAG AA, and guessed values usually break contrast or drift off
brand.

## Read first

- `docs/brand.md`: palette, tones, token usage, typography, logos, imagery and writing rules.
- `docs/design-system.md`: tokens, components, motion and composition rules.
- When a summary isn't enough: `src/styles/tailwind.css`, `src/components/button.tsx`, and
  `docs/brand/source/brand-guidelines.pdf` / `colors.jpeg`. If the docs and the tokens disagree,
  the tokens win; fix the docs.

## Rules

1. Build pages as tone bands with `<Section tone="paper|mist|lavender|ink|night|violet">`. Inside
   them, use semantic colors (`bg-canvas`, `text-fg`, `text-fg-muted`, `border-hairline`,
   `text-highlight`) so components work on light and dark bands.
2. Use brand colors only, through tokens. Never use stock Tailwind greys or purples, raw hex in
   components, or a per-item accent color.
3. There is no dark mode. The `ink` (#1B0049) and `night` (#0D0214) bands are the dark surfaces.
4. Primary actions use the `primary` variant of `Button` or `ButtonLink` (violet-600 #8052C2,
   dark purple #523573 on hover). Don't restyle buttons locally.
5. Violet #9A64D9 is for large type, focus rings, fills and gradients. Never put small white text on
   it. On the `violet` tone, text is black.
6. Manrope only, through the type-scale utilities. Labels use sentence case, never capitals.
7. Use the shipped logo files and `BrandMark` (decoration only). Never redraw, recolor or crop the
   logo.
8. No em dashes in visible copy.

## Finish check

- Every color comes from a token, and each band's tone is intentional.
- Text on every band meets AA.
- There is one primary action per view where possible.
- Headlines use the display scale with tight tracking, and body copy is short.
- Motion moves things with transform and opacity and uses the duration tokens, `motion-safe:` and
  `ease-brand`. Every interactive element answers hover, focus and press.
