---
paths:
  - "src/styles/**"
  - "**/*.css"
---

CSS tokens are canonical. Motion durations are the `--transition-duration-*` scale and easings the `--ease-*` tokens; add a new token rather than a raw value, and mirror it in src/lib/cn.ts and eslint-rules/index.mjs. Preserve six tone palettes, focus styles and reduced-motion rules. No page CSS or stock palette substitutions. Shell canvas/overflow/header behavior is opt-in.
