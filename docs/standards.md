# Engineering standards

The kit holds itself to a few hard rules, and machines check them wherever they can. This page is the index of those rules: each row names the rule and what enforces it. A rule marked **manual** is checked in review, by people or by the review checklists; everything else fails a local command and CI.

Run everything with `bun run verify`. The commands named below run each part on its own.

## Code

| Rule                                                                                                                                                                                                             | Enforced by                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| TypeScript `strict` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `isolatedModules` and `verbatimModuleSyntax` | `tsconfig.json`, `bun run typecheck`                                   |
| Type-aware lint: typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`, no floating promises, exhaustive `switch`, inline `type` imports                                                              | `eslint.config.mjs`, `bun run lint`                                    |
| React 19 rules: stable keys, no leaked `&&` renders, no nested component definitions, no unstable default props or context values, refs named `ref` or `…Ref`                                                    | `@eslint-react` `strict-type-checked`                                  |
| Hooks follow the rules of hooks and the React Compiler checks                                                                                                                                                    | `eslint-plugin-react-hooks`                                            |
| TSDoc on every export and on every top-level prop of an exported type                                                                                                                                            | `jsdoc/require-jsdoc` (published `src` only)                           |
| `docs/api.md` matches the TSDoc                                                                                                                                                                                  | `bun run check:api` (CI)                                               |
| Published code imports only relative paths and never application config, CMS clients or feature modules                                                                                                          | `no-restricted-imports`, `test/boundaries.test.ts`                     |
| Explicit named exports, no `export *`                                                                                                                                                                            | `no-restricted-syntax`, `scripts/catalog.mjs`                          |
| Every lint suppression is one line and says why: `// eslint-disable-next-line rule -- reason`. Unused suppressions fail                                                                                          | `eslint-comments/require-description`, `reportUnusedDisableDirectives` |
| No unused files, exports or dependencies                                                                                                                                                                         | `knip` (`bun run check:unused`)                                        |
| Every runtime export has a story or a documented nonvisual exception                                                                                                                                             | `test/catalog.test.ts`, `bun run manifests`                            |
| Line coverage of at least 80% for components and 90% for helpers                                                                                                                                                 | `vitest.config.ts` thresholds, `bun run test:coverage`                 |
| Conventional Commit messages with a lowercase summary of at most 72 characters                                                                                                                                   | `githooks/commit-msg`, the pull request title check                    |

Local hooks: `pre-commit` lints and formats staged files, and `pre-push` runs the typecheck and the unused-code scan.

## Package

| Rule                                                                                                 | Enforced by                                                 |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `package.json` exports, files and metadata are valid for publishing                                  | `publint --strict` (`bun run check:package`)                |
| Published types resolve for ESM consumers (`node16` and `bundler`)                                   | `@arethetypeswrong/cli` (`bun run check:package`)           |
| Bundle size budgets: everything, a single `Button` (tree-shaking), server-only typography, the shell | `size-limit` with `.size-limit.json` (`bun run check:size`) |
| The packed tarball installs and builds in a real Next app, with no test or assistant files inside    | `bun run test:consumer`                                     |
| Public API, token, visual or accessibility changes ship with a changeset                             | **manual** (review; see [releasing](releasing.md))          |

A size budget sits about 10% above the current size. Raise it in the same change that adds weight, and say why in the pull request.

## Accessibility

| Rule                                                                                              | Enforced by                                                           |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| JSX accessibility rules at the `strict` level, applied through the kit's link and button wrappers | `eslint-plugin-jsx-a11y`                                              |
| No WCAG 2.0–2.2 A/AA axe violations, contrast included, in every story                            | `@storybook/addon-a11y` with `test: "error"` (`bun run test:stories`) |
| No axe violations in component DOM tests                                                          | `test/axe.ts` in `*.test.tsx`                                         |
| Focus rings meet 3:1 against every tone                                                           | `e2e/explorer.spec.ts`                                                |
| Screen reader, zoom and reflow, forced colors, iPhone Safari                                      | **manual** (see [testing](testing.md#manual-accessibility-checks))    |

## Design and motion

| Rule                                                                                                                                                            | Enforced by                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| No raw colors (hex, `rgb()`, `oklch()` …) in classes or SVG color attributes, and no stock Tailwind palettes: semantic tokens or the violet and ink scales only | `tumai/no-raw-color`                                             |
| Durations come from the scale (`duration-press` … `duration-entrance`), easings are `ease-brand`, `ease-snappy` or `ease-in-out-soft`, and no `transition-all`  | `tumai/motion-tokens` (autofixes raw durations)                  |
| Every `animate-*` is `motion-safe:`, and every transform that responds to hover, focus, press or state is gated for reduced motion                              | `tumai/motion-tokens`                                            |
| No transitioned or animated filters (Safari clips filtered boxes)                                                                                               | `tumai/no-filter-motion`                                         |
| `"use client"` exactly where a module uses client-only hooks, DOM handlers or inline function props                                                             | `tumai/client-boundary`                                          |
| The [micro-interaction contract](design-system.md#micro-interaction-contract): hover, focus, press, open and close states on every interactive element          | **manual** (review)                                              |
| Composition rules (nested corners, equal heights, no meta rows)                                                                                                 | **manual** ([design system](design-system.md#composition-rules)) |

The `tumai/*` rules live in `eslint-rules/` with their tests, and apply to published source. Their messages name the fix.
