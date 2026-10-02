---
"@tum.ai/ui-kit": patch
---

Give the last controls without a hover state one, and fix chip contrast on the violet tone.

- A selected `ChipGroup` chip softens its fill slightly on hover (staying above 4.5:1 on every tone). Its count badge is now an inverted pill (canvas fill, foreground text), which also fixes the badge's contrast on the violet tone.
- The `Header` logo link gets the same soft tint as the navigation pill on hover.
- The `SkipLink` tints on hover, and slides in at 300ms with the house easing instead of Tailwind's default 150ms.
