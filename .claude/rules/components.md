---
paths:
  - "src/components/**"
  - "src/shell/**"
---

Read docs/design-system.md, docs/brand.md and the ds-component skill. Interactive elements follow the micro-interaction contract (design-system.md#micro-interaction-contract): hover, focus, press and open/close states built from the duration tokens and the `pressable` and `hover-lift` recipes. The `tumai/*` lint rules (eslint-rules/) enforce tokens, motion gates and `"use client"` placement; fix what they report rather than suppressing it. Components accept app data as props. Preserve server/client boundaries; relative imports only. Every public runtime export needs a story or documented nonvisual coverage.
