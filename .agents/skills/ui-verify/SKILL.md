---
name: ui-verify
description: Verify the rendered result of a TUM.ai UI-kit change in real browsers, covering responsive widths, keyboard and focus, overlays, reduced motion, axe and visual baselines. Use after any visual, layout, motion or interaction change, or before accepting updated screenshots.
---

# UI verification

1. Build or run Storybook (`bun run dev`, or `bun run build:storybook` and
   `node scripts/serve.mjs storybook-static 6006`). Inspect the affected stories at 320, 390, 768
   and 1440px.
2. Exercise keyboard navigation, open overlays, focus return, reduced motion, long content and
   fallback media.
3. Run `bun run test:stories` (Chromium and strict axe) and `bun run test:e2e` (Chromium and WebKit,
   visual baselines). Look at every changed screenshot before accepting it. Normal runs never
   update baselines; see `docs/testing.md`.
4. For CSS or asset changes that consumers see, run `bun run test:consumer`.
5. For ad hoc screenshots of stories at extra widths, use `references/sweep.md`.
6. Record screen reader, zoom/reflow, forced-colors and real iPhone Safari review separately
   (`references/iphone-safari.md`). Never claim an unrun check passed.

Browser workarounds are documented in `docs/browser-quirks.md`. Read it before changing the root
canvas, the header, dialogs or the motion utilities.

With several agents in parallel, don't run Storybook or Playwright in each one at once. Serialize
heavy runs or leave them to CI.
