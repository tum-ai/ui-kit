---
name: tumai-ci
description: TUM.ai corporate identity for the UI kit. Use whenever a change touches how the site looks, even if the brand isn't mentioned, including colours, tones and backgrounds, typography, buttons and interactive states, logos, imagery, gradients, visual copy, or a new component or pattern. It gives the brand palette, tone bands, type scale and logo rules, taken from the brand guide and the live tokens.
---

# TUM.ai CI

The kit's visual system is the 2026 TUM.ai brand guide, implemented as tokens in `src/styles/tailwind.css`
and components in `src/components`. Work from those files, not from memory: the tokens are
already tuned for WCAG AA, and guessed values usually break contrast or drift off brand.

## Read first

- `references/brand-tokens.md`: palette, tones, type scale, logos, buttons, identity.
- `docs/design-system.md`: tones, typography, components, motion and composition rules.
- Sources when the summary isn't enough: `docs/brand/source/brand-guidelines.pdf`,
  `docs/brand/source/colors.jpeg`, `src/styles/tailwind.css`, `src/components/button.tsx`.

## Workflow

1. Build pages as tone bands: `<Section tone="paper|mist|lavender|ink|night|violet">`. The tone
   sets semantic tokens (`bg-canvas`, `text-fg`, `text-fg-muted`, `border-hairline`,
   `text-highlight`), so the same component works on light and dark bands.
2. Use brand colours only, through tokens. Never add stock Tailwind greys or purples, raw hex in
   components, or a per-item accent colour.
3. There is no dark mode. Dark surfaces are the `ink` (#1B0049) and `night` (#0D0214) bands, used
   for heroes, feature bands, CTAs and the footer.
4. Primary actions use the ds `Button`/`ButtonLink` `primary` variant: violet-600 (#8052C2) so white
   labels pass AA, dark purple (#523573) on hover. Don't restyle buttons locally.
5. Violet #9A64D9 is the brand accent for large type, focus rings, fills and gradients. Don't put
   small white text on it (fails AA); on the `violet` tone, text is black.
6. Manrope only, through the type-scale utilities (`text-display-*`, `text-heading-*`,
   `text-lead`, `text-body`, `text-small`, `text-meta`, `text-eyebrow`).
7. Use the shipped logo files and `BrandMark` (logomark as decoration). Never redraw, recolour or
   crop the logo.

## Finish check

- Every colour comes from a token; the tone of each band is intentional.
- Text on every band meets AA (the tone tokens do this; custom colours usually don't).
- Primary action is the ds primary button; one primary per view where possible.
- Headlines use the display scale with tight tracking; body copy is calm and short.
- Logos are the provided files; no invented marks or colourways.
- Motion follows `docs/design-system.md` (transform and opacity, `motion-safe:`, `ease-brand`).
