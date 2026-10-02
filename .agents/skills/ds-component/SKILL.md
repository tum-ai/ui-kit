---
name: ds-component
description: Add, change or extend a TUM.ai UI-kit component (src/components or src/shell), including variants, props, stories, tests, TSDoc and usage notes. Use for any new component, new variant, prop rename or behavior change in the kit.
---

# Component workflow

1. **Read the contracts.** `docs/design-system.md` (API conventions), `docs/portability.md`, the
   relevant `docs/components/*.md`, and the header of `src/index.ts`. For anything visual, also load
   the `tumai-brand` skill.
2. **Reuse first.** Look for an existing family or variant that covers the need. A new cva variant
   beats a near-duplicate component.
3. **Implement** following `references/component-template.md`:
   - cva variants with `defaultVariants`
   - `as` / `headingAs`, `tone` (bands only) vs `emphasis` (text)
   - `className` / `classNames`, ref as a prop
   - Base UI for interaction, semantic tokens only, TSDoc on every export and prop
   - the micro-interaction contract (`docs/design-system.md#micro-interaction-contract`): hover,
     focus, press and open/close states from the duration tokens and the `pressable` and
     `hover-lift` recipes, gated for reduced motion
   - relative imports only, no application config, CMS or feature modules
   - `"use client"` only when the component itself needs it
4. **Stories.** Colocate `<name>.stories.tsx` with an explicit `title`, `parameters.kit.exports`
   naming every runtime export it documents, and `parameters.kit.tones`. Show every named variant
   and the important interaction states. Add keyboard play functions, and never skip axe. Use
   local fixtures (`/assets/placeholder.svg`), never remote images.
5. **Tests.** Colocate behavior tests (`--project dom`) with an axe assertion. Test focus return,
   portals and edge cases; avoid snapshot-only tests.
6. **Exports and docs.** New exports go through `src/index.ts` or `src/shell/index.ts`. When
   several agents work in parallel, the integrating agent owns these. Update `docs/components/*.md`.
   Run `bun run manifests` to regenerate `docs/api.md` (never hand-edit it).
7. **Check.** Run `bun run lint`, `bun run typecheck` and `bunx vitest run --project dom <test>`.
   Run the `ui-verify` skill for visual changes. Add a Changeset (`bun run changeset`) for public
   API, token, visual or accessibility changes.
