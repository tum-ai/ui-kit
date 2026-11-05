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

## Performance

The field is built to hold up on old phones:

- Each field starts once it is within a viewport of the screen and the page
  is idle, so fields further down a page cost nothing at load.
- It declines software WebGL (`failIfMajorPerformanceCaveat`): on a blocked
  GPU the CSS dots show instead of a full-screen shader running on the CPU.
- It watches its own frame times and steps down when they fall well behind
  its frame cap: half the pixels, then about a third of the pixels at 30 fps,
  then one still frame. It never steps back up, and every field on the page
  shares the level, so a field further down starts where the first settled.
  The canvas carries the level as `data-quality` (0 is full quality).
- Devices reporting at most 2 GB of memory or 2 cores start one step down.

## Tokens

`halftone.css` defines the sun ramp as `--sun-100` to `--sun-900` (sampled
from the 2025 and 2026 Makeathon posters). Use it for the sun and the dots
only, not as a general accent.
