---
"@tum.ai/ui-kit": patch
---

`DayRuler`'s `drawIn` now plays the first time the ruler scrolls into view, not on page load, so a ruler below the fold still draws in where a visitor sees it. The ticks now rise left to right with the fill before the mark and its label fade in. Server HTML stays fully drawn and reduced motion skips it. `DayRuler` is now a client component; `Reveal` and `DayRuler` share one scroll observer.
