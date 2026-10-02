# Brand guide

This guide summarizes how the TUM.ai identity is applied in the kit. It is based on the 2026 TUM.ai brand guidelines (`docs/brand/source/brand-guidelines.pdf` and `docs/brand/source/colors.jpeg`). Those guidelines are implemented as tokens in `src/styles/tailwind.css`. If this page and the tokens disagree, the tokens are correct and this page needs an update.

For token tables, component APIs and motion rules, see the [design system](design-system.md).

## Who may use the identity

The code is MIT-licensed. The TUM.ai name, logos, marks and the `BrandMark` geometry are not. They are for projects authorized by TUM.ai. Using the kit does not imply affiliation or endorsement. If you build something that is not a TUM.ai project, use the components with your own name and logo, and do not ship the TUM.ai marks. The full terms are in [BRAND-ASSETS.md](../BRAND-ASSETS.md).

## Character

TUM.ai brings academic rigor and a builder's mindset together. The mission is "to bridge the gap between theory and practice by empowering students to build the future of AI". The vision is "to be the defining hub for AI talent in Europe, a community where technical precision meets human creativity".

In the interface, that character shows up as:

- **Precise.** Clean grids, thin rules, strong hierarchy, few decorative effects.
- **Confident.** Large, light-weight headlines and dark indigo bands.
- **Calm.** Generous whitespace and light bands for reading.
- **Alive.** Small, purposeful motion that is always optional.

If a design starts to look like a generic SaaS template, simplify it.

## Palette

| Name                              | Hex                | CSS variable / Tailwind color           | Main use                                         |
| --------------------------------- | ------------------ | --------------------------------------- | ------------------------------------------------ |
| White                             | #FFFFFF            | `--color-white` / `white`               | `paper` band, text on dark bands                 |
| Minimal Grey                      | #EFEFEF            | `--color-minimal-gray` / `minimal-gray` | `mist` band                                      |
| Lavender Tint                     | #F5EFFF            | `--color-violet-50` / `violet-50`       | `lavender` band, soft emphasis                   |
| Electric Lavender (TUM.ai violet) | #9A64D9            | `--color-violet-500` / `violet-500`     | Accent, large type, focus ring, `violet` band    |
| Dark Purple                       | #523573            | `--color-violet-800` / `violet-800`     | Primary button hover, gradient end               |
| Dark Indigo                       | #1B0049            | `--color-violet-950` / `violet-950`     | `ink` band, text on light bands                  |
| Black                             | #0D0214            | `--color-black` / `black`               | `night` band, footer, page canvas                |
| Electric Fade                     | #9A64D9 to #523573 | `text-gradient-brand`                   | Highlighted words (`<Highlight variant="fade">`) |

Two derived scales complete the palette:

- `violet-50…950`: tints and shades of the brand violet. **violet-600 (#8052C2)** is the primary button fill, because white text on it reaches a 5.4:1 contrast ratio and on violet-500 it does not.
- `ink-200`, `ink-600`, `ink-950`: violet-tinted neutrals for rare surfaces, text and scrims.

Do not introduce other hues, stock Tailwind greys or purples, or a separate accent color per item.

## Tones

A page is a sequence of full-width bands. `<Section tone="…">` sets the band, and every component inside reads its colors from it. The same card therefore works on light and dark bands. Every text and background pair meets WCAG AA.

| Tone       | Canvas  | Text        | Use for                                  |
| ---------- | ------- | ----------- | ---------------------------------------- |
| `paper`    | #FFFFFF | Dark Indigo | Default reading band                     |
| `mist`     | #EFEFEF | Dark Indigo | Alternate light band                     |
| `lavender` | #F5EFFF | Dark Indigo | Soft emphasis, forms, FAQs               |
| `ink`      | #1B0049 | White       | Heroes, feature bands, calls to action   |
| `night`    | #0D0214 | White       | Deep contrast, footer                    |
| `violet`   | #9A64D9 | Black       | Large type only (figures), use sparingly |

There is no separate dark mode. The `ink` and `night` bands are the dark surfaces.

## Using the tokens

`@tum.ai/ui-kit/tailwind.css` defines everything above as Tailwind 4 theme variables, so they work as utilities and as plain CSS variables in your own code:

```tsx
<div className="bg-violet-950 text-white">…</div>      // raw brand color
<p className="text-fg-muted border-hairline">…</p>    // semantic, follows the band's tone
```

```css
.my-rule {
  border-color: var(--color-violet-500);
  color: var(--tone-fg); /* the current band's text color */
}
```

Two layers are available:

- **Brand scales** (`violet-*`, `ink-*`, `minimal-gray`, `black`, `indicator`) are fixed colors. The kit's `violet` scale replaces Tailwind's stock violet, and `black` is the brand black. Tailwind's other stock palettes, such as `gray` or `purple`, remain technically available but are off-brand.
- **Semantic colors** (`canvas`, `raised`, `sunken`, `fg`, `fg-muted`, `fg-subtle`, `hairline`, `hairline-strong`, `highlight`) resolve per tone through `--tone-*` variables set by `data-tone`. Prefer these in components, so the same markup works on light and dark bands.

The type scale (`text-display-*`, `text-heading-*`, …), the `ease-brand` easing and the custom utilities (`grain`, `zoom-media`, `text-gradient-brand`, …) come from the same stylesheet. The [design system](design-system.md#tones) lists them all.

## Typography

Manrope is the only typeface. The brand guidelines set H1 at 120pt/1.0, H2 at 80pt/1.1, H3 at 48pt/1.2 and body text at 21pt/1.4. The kit scales these fluidly with the `text-display-*`, `text-heading-*`, `text-lead`, `text-body`, `text-small`, `text-meta` and `text-eyebrow` utilities.

- Display sizes and figures use Light (300) with tight negative tracking. `display-md` is Regular, headings are Medium and labels are Semibold.
- Labels and eyebrows use sentence case, never all capitals.
- Hierarchy comes from size and weight, not decoration.
- Choose the HTML heading level for the document outline and the visual size separately.

## Logos and marks

| Asset                                | Use                                                           |
| ------------------------------------ | ------------------------------------------------------------- |
| `assets/tum_ai_logo_new.svg`         | Primary logo                                                  |
| `assets/logo_new_white_standard.png` | White logo, only on sufficiently dark backgrounds             |
| `BrandMark` component                | The logomark geometry as a large, tonal background decoration |

- Use the supplied files unchanged. Do not redraw, recolor, crop, stretch or rebuild the logo.
- `BrandMark` is decoration. It never stands in for the logo, and it carries no meaning for assistive technology.

## Color in practice

- **Primary actions** use the `primary` variant of `Button` or `ButtonLink`: a flat violet-600 fill with a white label, turning dark purple on hover. Use one primary action per view where possible, and don't restyle buttons locally.
- **Secondary actions** use `secondary`, `outline`, `ghost`, or `inverse` on dark bands and photos.
- **Violet (#9A64D9)** is for large type, focus rings, fills and gradients. Never put small white text on it, because the contrast fails AA. On the `violet` band, text is black.
- **Focus** is a 3px violet ring with an offset, or violet-300 on dark bands. Never remove it.

## Imagery

- Use documentary photography of real events and people, with permission, and factual captions. The `Photo` component provides the brand frame (rounded corners or full bleed) and aspect ratios.
- When an image is missing, use the branded `BrandPanel` placeholder or `assets/placeholder.svg` rather than an unrelated picture.
- Show partner logos with `LogoTile` and `LogoWall`, which use monochrome or chip treatments so that no partner's color competes with the brand.
- Use decorative light only on dark bands (`Aurora`, `grain`, `BrandMark`).

## Motion

Motion is small, crisp and never bouncy. Use the house easing `ease-brand` and the duration tokens, from `duration-press` (150ms) to `duration-entrance` (1s); nothing runs longer than 1.2s except ambient loops. Animate only transform and opacity. Typical moves are a 1.04 image zoom, a 4px card lift and an arrow nudge. Everything respects `prefers-reduced-motion`. Full rules are in the [design system](design-system.md#motion-rules).

## Writing

- Keep body copy short and calm. Let headlines carry the statement.
- Don't use em dashes in visible copy. Use a comma, colon, period or a spaced hyphen instead.
- Don't repeat a name next to a logo that already shows it.
- Make link text describe its destination. Links that open a new tab announce it automatically.

## Checklist

- Every color comes from a token, and each band's tone is intentional.
- Text on every band meets AA. The tone tokens ensure this; custom colors usually break it.
- The primary action uses the kit's primary button.
- Headlines use the display scale with tight tracking.
- Logos are the supplied files, without invented marks or color variants.
- Motion uses transform and opacity, the duration tokens, `motion-safe:` and `ease-brand`. Every interactive element answers hover, focus and press.
