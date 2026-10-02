---
"@tum.ai/ui-kit": minor
---

Add a motion scale and two motion recipes to `tailwind.css`.

- Duration tokens: `duration-press` (150ms), `duration-hover` (300ms), `duration-surface` (500ms), `duration-media` (700ms) and `duration-entrance` (1000ms). `cn` merges them like Tailwind's own durations, and now also knows `animate-draw`.
- `pressable` (a 3% shrink while pressed, landing in `duration-press`) and `hover-lift` (the 4px card lift, now also on keyboard focus of the card or a link or button inside it).
- A bare `transition-*` utility now defaults to 300ms with the house easing instead of Tailwind's 150ms. Apps that import the kit's styles get the same default.
- Reduced motion: the `SpotlightCard` pointer light no longer fades, and the header's menu icon no longer nudges or grows (its second bar now scales instead of animating its width).
