---
"@tum.ai/ui-kit": minor
---

Make interactions feel consistent across the kit.

- Filled and outlined buttons, filter chips, linked logo tiles, the dialog close button and the header's menu buttons share one press response (`pressable`: a 3% shrink while pressed, none under reduced motion). `Button variant="link"` doesn't shrink, like `TextLink`.
- Keyboard focus now gets the same move as hover: Button and `TextLink` arrows, `IndexList` rows, the mobile menu's item arrows and hamburger, the rotating close buttons, `card-hover:` (so `IconBadge interactive` reacts to a focused card) and `zoom-media`.
- An `Accordion` answer fades with its height and closes a little faster (300ms instead of 500ms). The fade sits on the panel, so a find-in-page match shows at once. The open/close icon shrinks slightly while pressed.
- `Prose` thickens only the hovered link's underline, with a short transition; before, hovering anywhere in the text thickened every link.
- `Eyebrow` with an `index` reads "03, Projects" to screen readers instead of "03Projects".
