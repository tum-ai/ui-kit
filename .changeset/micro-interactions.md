---
"@tum.ai/ui-kit": minor
---

Make interactions feel consistent across the kit.

- Buttons, filter chips, linked logo tiles, the dialog close button and the header's menu buttons share one press response (`pressable`: a 3% shrink while pressed, none under reduced motion).
- Button and `TextLink` arrows nudge on keyboard focus as they do on hover.
- An `Accordion` answer fades in with its height and out a little faster, and the open/close icon answers a press.
- `Prose` thickens only the hovered link's underline; before, hovering anywhere in the text thickened every link.
- `Eyebrow` with an `index` reads "03, Projects" to screen readers instead of "03Projects".
