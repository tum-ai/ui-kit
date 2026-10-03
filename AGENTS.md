# TUM.ai UI kit

Component library for Next.js 16, React 19 and Tailwind 4, published as `@tum.ai/ui-kit`. Tooling: Bun 1.4.2, Node 24, TypeScript, ESLint, Prettier, Storybook, Vitest and Playwright.

## Read first

- UI changes: `docs/design-system.md` (tokens, API conventions, motion and composition rules) and `docs/brand.md` (palette, tones, logos).
- Component contracts: `docs/components/*.md` and `docs/portability.md`.
- Standards: `docs/standards.md` lists every enforced rule (lint, types, tests, package checks) and the command that checks it. Fix a failing rule instead of suppressing it; a suppression needs `-- reason`.
- Testing and accessibility: `docs/testing.md`. Safari workarounds: `docs/browser-quirks.md`.
- `docs/api.md` is generated from TSDoc by `node scripts/generate-api.mjs` (also part of `bun run manifests`). Never edit it by hand; `bun run check:api` fails when it is stale. The pre-push hook runs `typecheck` and `check:unused`.

## Commands

- Local loop: `bun run lint`, `bun run typecheck`, and targeted tests with `bunx vitest run --project dom <test>` or `--project unit <test>`.
- Full acceptance: `bun run verify`. It is heavy: it builds everything and runs browser stories, E2E and the packed consumer.
- Use Vitest, not `bun test`. jsdom does not prove contrast. Interactive components need real browser stories with axe.

## Architecture rules

- Published code imports only relative paths. Components never import application config, CMS clients or feature modules.
- Keep server/client boundaries. Add `"use client"` only where the component itself uses state, effects or handlers.
- Every export and prop has TSDoc. React 19 refs are plain props.
- `tone` always means a band tone (`paper`, `mist`, `lavender`, `ink`, `night`, `violet`). A text color inside a band is `emphasis`.
- Use semantic tokens (`bg-canvas`, `text-fg`, `border-hairline`, `text-highlight`), never raw hex or stock Tailwind palettes. Use Base UI for interactive behavior.
- Motion uses the duration tokens, house easings and the `pressable` / `hover-lift` recipes, and every interactive element meets the micro-interaction contract (`docs/design-system.md#micro-interaction-contract`). The `tumai/*` lint rules enforce tokens, motion gates and `"use client"` placement.
- Keep the existing appearance and meaningful behavior. Document intentional portability changes in `docs/portability.md`.
- Public API, token, visual or accessibility changes need a Changeset (`bun run changeset`).

## Working agreements

- Preserve unrelated changes in the working tree.
- Don't commit, push, publish to npm, create releases or deploy unless the person you are working for asks.
- Commits and pull request titles are Conventional Commits with lowercase summaries of at most 72 characters.
- `main` changes only through pull requests the code owner approves (`docs/repository.md`). Fill in `.github/pull_request_template.md` completely; `Validate PR body` checks it. A change to `src/` or `assets/` (tests, stories and `testing.ts` excluded) needs phone (390) and desktop (1440) screenshots of the affected stories under `## Screenshots`, or the `no-visual-change` label. Attach them with `gh pr create --attach phone.png --attach desktop.png` (or `gh pr edit --attach`) and check they ended up in the Screenshots table.
- Report which checks actually ran. Never claim an unrun manual accessibility check passed.

## Parallel agents

When several agents work at once, each one edits only its assigned component files, tests, stories and usage notes. One integrating agent owns shared configuration, styles, dependencies, the export barrels, shared helpers and generated docs. Never revert another agent's changes. Don't run several `verify`, Storybook or Playwright runs at the same time.

## Assistant configuration

Shared skills live in `.agents/skills/` (`ds-component`, `tumai-brand`, `ui-verify`, `pr-ready`, `release`). Claude Code also uses `.claude/` (skill links, review subagents, path rules and an edit hook). See `docs/ai-assistants.md`.
