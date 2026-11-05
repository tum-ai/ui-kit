---
"@tum.ai/ui-kit": patch
---

No tap flash on touch screens: the base styles set `-webkit-tap-highlight-color` to transparent instead of a brand purple tint, which showed on iPhone and Android as a short coloured blink over the tapped link or button (most visibly over a whole FAQ row).
