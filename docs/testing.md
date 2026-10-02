# Testing and verification

## Commands

| Command                                  | Purpose                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `bun run lint` / `bun run format:check`  | Static semantics, boundaries and formatting                                 |
| `bun run typecheck`                      | Public implementation, tests and stories                                    |
| `bun run test` / `bun run test:coverage` | Vitest node/jsdom, with 80% component and 90% helper line floors            |
| `bun run test:stories`                   | Every story in Chromium, plays and strict axe                               |
| `bun run build:storybook`                | Production explorer                                                         |
| `bun run manifests`                      | Generate catalog/tokens/API documentation and validate export coverage      |
| `bun run test:e2e`                       | Chromium/WebKit browser and visual cases                                    |
| `bun run test:consumer`                  | Pack, install outside the checkout, compile a real Next app and exercise it |
| `bun run render:design`                  | Deterministic component render bundle for later Figma work                  |

Every new public component needs documented props, a story, a behavioral test where meaningful, and accessible supported examples. Compound primitives are shown together. Nonvisual helper exceptions must name their documentation/testing coverage.

## Accessibility

The Storybook addon fails on applicable WCAG 2/2.1/2.2 A/AA violations. It scans body so portal dialogs are included. Interaction stories scan open states. Jsdom disables color contrast and landmark checks because it cannot lay out a real page; browser stories and E2E cover those constraints. A passing axe run does not establish conformance.

Review keyboard navigation, visible focus, overlay focus return, VoiceOver announcements, 200% zoom/400% reflow, forced colors, reduced motion and real iPhone Safari. Record manual checks in the PR or verification report. Untested checks remain explicitly unverified. Violet bands support a restricted palette: do not demonstrate known-invalid combinations and silence axe.

## Visual changes

Baselines are platform- and browser-specific. For the macOS 26 visual CI baselines, use Node 24 and the locked Playwright browsers, then run `bunx playwright test --grep @visual --update-snapshots`. Review images before adding them to a change. Normal CI never regenerates baselines. Local macOS baselines do not prove Linux matches. Browser updates require an intentional baseline refresh in the same dependency change.

Fixtures use local artwork and fixed text. Tests wait for fonts and images; motion is disabled for captures, and motion behavior is exercised separately. Reports and traces are CI artifacts. Avoid arbitrary sleeps, fixed live dates and remote CMS assets.

Visual CI runs on the pinned macOS 26 arm64 runner to match the reviewed Darwin snapshots; unit and tarball jobs also run on Linux. Browser behavior still runs in Chromium and WebKit. [Runner availability](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

### Base UI focus guard exception

The cross-engine axe helper excludes only `[data-base-ui-focus-guard]`. Base UI intentionally exposes these invisible sentinels as buttons in Safari so VoiceOver swipes trigger focus redirection; adding aria-hidden breaks that behavior. Its maintainer recommends this precise exclusion ([upstream #5237](https://github.com/mui/base-ui/issues/5237)). All actual overlay content, controls, triggers and contrast rules remain checked. Keyboard trapping is tested independently. This is an automated-tool exception, not a claim that VoiceOver has been manually verified. Reassess it on Base UI upgrades.

## Extraction parity

`SOURCE_WEBSITE_DIR=/path/to/frozen/worktree node scripts/compare-source.mjs` builds an isolated reference explorer from the exact revision in `extraction.json`. It renders twelve representative components with identical fixtures at all four widths and records byte-level PNG equality in `artifacts/parity/comparison.json`. It preserves the website checkout and leaves the source comparison outside the published package. Intentional portability/accessibility differences are listed in [portability](portability.md).
