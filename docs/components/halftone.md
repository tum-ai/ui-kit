# Halftone and sun

An opt-in pair after the Makeathon posters, published apart from the main
barrel so it neither needs the kit's Tailwind theme nor weighs on apps that
skip it:

```tsx
import { HalftoneField, Sun } from "@tum.ai/ui-kit/halftone";
import "@tum.ai/ui-kit/halftone.css";
```

| Export          | Use                                                                                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HalftoneField` | Decorative WebGL2 dot field that fills its positioned parent. Loads after the page is idle, draws only while on screen, holds one still frame under reduced motion and falls back to CSS dots without JavaScript or WebGL. |
| `Sun`           | Decorative disc in the sun ramp with a soft glow. Absolutely positioned and square; the caller sets size and position.                                                                                                     |

## Composition

- Put the field in a `relative isolate` band on a dark tone (`night` or `ink`)
  and lift the content above it (`-z-10` on the field).
- Pass the sun's `ref` as `sunRef`: the dots warm toward its centre, tracked
  every frame, so a sun that moves (scroll, animation) carries the warmth.
- `clearRef` keeps a box (the headline) mostly clear of dots.
- `initial.fadeTop` / `fadeBottom` dissolve the dots dot by dot between two
  heights (fractions of the field, top down), for a horizon or a soft seam.
- `rise={false}` skips the bloom from the sun; `pointer` adds a lens under
  fine pointers.
- Reshape the CSS fallback with `--halftone-mask`, `--halftone-cell` and
  `--halftone-dot` on the field.

## Tokens

`halftone.css` defines the sun ramp as `--sun-100` to `--sun-900` (sampled
from the 2025 and 2026 Makeathon posters). Use it for the sun and the dots
only, not as a general accent.
