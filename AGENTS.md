# TUM.ai UI kit

Next.js 16 / React 19 / Tailwind 4 component library, Bun, TypeScript, ESLint, Prettier, Storybook, Vitest and Playwright.

Read docs/design-system.md before UI changes. Source revision is in extraction.json. Preserve unrelated work. No commits, pushes, deployments or publishing without authorization. Never inspect Vercel accounts for this task.

Use `bun run lint`, `bun run typecheck`, targeted `bunx vitest run --project dom <test>` and `--project unit` for the local loop. Full acceptance is `bun run verify`. Tests for interactive components include real browser stories and axe; jsdom does not prove contrast.

Published imports are relative; components never import application config, CMS or feature modules. Keep server/client boundaries and TSDoc. `tone` is a band; `emphasis` is text. React 19 refs are props. Use semantic tokens and Base UI. Keep existing appearance and meaningful behavior; portability changes are documented.

Workers own only explicitly assigned component files, tests, stories and usage notes. The coordinator owns configuration, styles, dependencies, exports, shared helpers and integration. You are not alone in the codebase: never revert another worker's changes.
