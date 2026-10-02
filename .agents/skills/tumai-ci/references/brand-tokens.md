# TUM.ai brand tokens

Summary of `docs/brand/source/` (brand guide PDF and `colors.jpeg`) as implemented in
`src/styles/tailwind.css`. If this file and `index.css` disagree, `index.css` wins; fix this file.

## Identity

The brand guide frames TUM.ai as the hub where academic rigour meets a make-it-happen builder
mindset.

- Mission: "To bridge the gap between theory and practice by empowering students to build the
  future of AI."
- Vision: "To be the defining hub for AI talent in Europe, a community where technical precision
  meets human creativity."

For UI that means clean and technically precise, confident and modern, community-oriented but
restrained. If a choice looks more like generic SaaS than TUM.ai, simplify it.

## Palette (brand anchors)

| Name                              | Hex                | Theme token                          | Main use                                      |
| --------------------------------- | ------------------ | ------------------------------------ | --------------------------------------------- |
| White                             | #FFFFFF            | `--color-white`                      | `paper` band, text on dark bands              |
| Minimal Grey                      | #EFEFEF            | `--color-minimal-gray`               | `mist` band                                   |
| Lavender Tint                     | #F5EFFF            | `--color-lavender-tint`, `violet-50` | `lavender` band, soft emphasis                |
| Electric Lavender (TUM.ai violet) | #9A64D9            | `--color-tumai-violet`, `violet-500` | accent, large type, focus ring, `violet` band |
| Dark Purple                       | #523573            | `--color-dark-purple`, `violet-800`  | primary hover, gradient end                   |
| Dark Indigo                       | #1B0049            | `--color-dark-indigo`, `violet-950`  | `ink` band, text on light bands               |
| Black                             | #0D0214            | `--color-black`, `ink-950`           | `night` band, footer, root canvas             |
| Electric Fade                     | #9A64D9 to #523573 | gradient                             | highlights (`Highlight variant="fade"`)       |

Derived scales (never invent other hues):

- `violet-50…950`: 500 is the brand violet, 800 dark purple, 950 dark indigo. **violet-600
  (#8052C2)** is the primary button fill: white text on it reaches 5.4:1 (AA), which violet-500
  does not.
- `ink-50…950`: violet-tinted neutrals for rare surfaces and text.

## Tones

`<Section tone>` sets `data-tone`, which defines the semantic tokens below. Each foreground pair
meets WCAG AA on its canvas.

| Tone       | Canvas  | Text        | Use                                |
| ---------- | ------- | ----------- | ---------------------------------- |
| `paper`    | #FFFFFF | dark indigo | default reading band               |
| `mist`     | #EFEFEF | dark indigo | alternate light band               |
| `lavender` | #F5EFFF | dark indigo | soft emphasis, forms, FAQs         |
| `ink`      | #1B0049 | white       | heroes, feature bands, CTAs        |
| `night`    | #0D0214 | white       | deep contrast, footer              |
| `violet`   | #9A64D9 | black       | large type only (stats), sparingly |

Semantic utilities: `bg-canvas`, `bg-raised`, `bg-sunken`, `text-fg`, `text-fg-muted`,
`text-fg-subtle`, `border-hairline`, `border-hairline-strong`, `text-highlight` (AA-safe accent
per tone), and tone-aware tints such as `bg-fg/[0.07]`.

## Typography

Manrope (`assets/Manrope.ttf`, loaded by the optional fonts.css export) is the only typeface.
The brand guide sets H1 120pt/1.0, H2 80pt/1.1, H3 48pt/1.2 and text 21pt/1.4; the site scales
these fluidly:

| Utility                                  | Size               | Use                         |
| ---------------------------------------- | ------------------ | --------------------------- |
| `text-display-2xl`                       | up to 128px        | home hero only              |
| `text-display-xl`                        | up to 100px        | page heroes                 |
| `text-display-lg`                        | up to 72px         | big statements, CTAs        |
| `text-display-md`                        | up to 54px         | section titles              |
| `text-heading-lg` / `-md` / `-sm`        | 34 / 23 / 17px     | card and sub-section titles |
| `text-lead`                              | up to 21px         | intros                      |
| `text-body` / `text-small` / `text-meta` | 16 / 14 / 13px     | copy and metadata           |
| `text-eyebrow`                           | 14px sentence case | labels above headlines      |

Display sizes and figures are Light (300) with tight negative tracking, as in the brand guide;
`display-md` is Regular, headings Medium, labels Semibold and never in capitals. Hierarchy comes
from size and weight, not decoration.

## Logos

- `assets/tum_ai_logo_new.svg`: the primary logo (preloaded on every page by the header).
- `assets/logo_new_white_standard.png`: white logo, only on dark enough backgrounds.
- `BrandMark` (`src/components/brand-mark.tsx`): the logomark geometry as a large tonal
  background shape, as on the brand guide's section slides. Decoration only, never a logo.

Never redraw, recolour, crop or rebuild the logo.

## Buttons and interaction

Canonical implementation: `src/components/button.tsx` (`buttonStyles`, `Button`,
`ButtonLink`, `IconButton`).

- `primary`: a flat violet-600 fill with a hairline highlight, white label, dark purple on hover.
  No glow or sheen.
- `secondary`, `outline`, `ghost`: read the surrounding tone, so they work on light and dark bands.
- `inverse`: solid white, for secondary actions on dark bands and photos.
- `link`: inline text action in the tone's highlight colour.
- Sizes `sm`, `md`, `lg`; a badge next to a button uses the same size step.
- Focus: a global 3px violet ring with offset (violet-300 on dark bands). Never remove it.

Interaction feels crisp and confident, never bouncy: small hover zoom (1.04), arrow nudges, a 4px
lift, `ease-brand`.
