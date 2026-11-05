---
"@tum.ai/ui-kit": minor
---

Hold up on old and low-end devices. The header watches frame pacing while the page scrolls and, once frames fall well behind (or the reader prefers reduced transparency), marks the page `data-effects="reduced"`: its pill then drops the backdrop blur for a nearly opaque fill. The new `effects-reduced:` variant lets other costly surfaces do the same. `HalftoneField` starts only within a viewport of the screen, declines software WebGL (the CSS dots show instead) and steps down its resolution, frame rate and finally to a still frame when its own frames run slow (`data-quality` on the canvas).
