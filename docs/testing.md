# Testing and verification

## Commands

| Command                                  | Purpose                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `bun run lint` / `bun run format:check`  | Static semantics, boundaries and formatting                                 |
| `bun run typecheck`                      | Public implementation, tests and stories                                    |
| `bun run check:unused`                   | Unused files, exports and dependencies (knip)                               |
| `bun run check:api`                      | Regenerate `docs/api.md` and fail if it differs from the version in Git     |
| `bun run check:package` / `check:size`   | publint, attw type resolution and bundle size budgets (after `build`)       |
| `bun run test` / `bun run test:coverage` | Vitest node/jsdom, with 80% component and 90% helper line floors            |
| `bun run test:stories`                   | Every story in Chromium, plays and strict axe                               |
| `bun run build:storybook`                | Production explorer                                                         |
| `bun run manifests`                      | Generate catalog/tokens/API documentation and validate export coverage      |
| `bun run test:e2e`                       | Chromium/WebKit browser and visual cases, plus the per-story motion audits  |
| `bun run test:consumer`                  | Pack, install outside the checkout, compile a real Next app and exercise it |
| `bun run render:design`                  | Deterministic component render bundle for design review                     |

The rules these commands enforce are listed in [engineering standards](standards.md).

Every new public component needs documented props, a story, a behavioral test where meaningful, and accessible supported examples. Compound primitives are shown together. Nonvisual helper exceptions must name their documentation/testing coverage.

## Accessibility

The Storybook addon fails on applicable WCAG 2/2.1/2.2 A/AA violations. It scans body so portal dialogs are included. Interaction stories scan open states. Jsdom disables color contrast and landmark checks because it cannot lay out a real page; browser stories and E2E cover those constraints. A passing axe run does not establish conformance.

Violet bands support a restricted palette: do not demonstrate known-invalid combinations and silence axe.

### Motion and interaction audits

`e2e/motion.spec.ts` walks every story in the built explorer. With reduced motion (the `chromium` project) it hovers and tabs through each story and fails if any animation or transition moves, resizes or repositions something; colour fades may run. With motion on (the `motion` project) it fails if a visible link or button looks the same hovered as at rest, or if a `pressable` control does not shrink while pressed. Mark an element (or a wrapper) `data-static-hover` only when it brings no styling by design, as the unstyled `Anchor` does.

`test/contrast.test.ts` computes each tone's token contrast from `src/styles/tailwind.css`, so a token change that breaks AA fails without a browser.

### Manual accessibility checks

Automated checks do not establish WCAG conformance. Axe cannot resolve some gradient and image backgrounds and reports them as inconclusive; treat those as manual-review items, not passes. Changes that affect structure, focus, motion or color need a manual pass of the relevant items:

| Check                             | What to confirm                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Keyboard                          | Logical order, visible focus, overlays trap focus and return it to the trigger  |
| Screen reader (VoiceOver or NVDA) | Names, roles, dialog announcements, external-link hints                         |
| 200% zoom and 400% reflow         | No clipped content or horizontal scrolling at 320 CSS pixels                    |
| Forced colors                     | Borders and icons remain visible (focus rings are automated)                    |
| Reduced motion                    | Counters and reveals read well when static (movement itself is automated)       |
| Real iPhone Safari                | The [iPhone checklist](../.agents/skills/ui-verify/references/iphone-safari.md) |
| Gradient and image backgrounds    | Text contrast in every rendered state                                           |

Record which checks you ran, and which you did not, in the pull request. A check that was not run stays unverified.

## Visual changes

Baselines are platform- and browser-specific. For the macOS 26 visual CI baselines, use Node 24 and the locked Playwright browsers, then run `bunx playwright test --grep @visual --update-snapshots`. Review images before adding them to a change. Normal CI never regenerates baselines. Local macOS baselines do not prove Linux matches. Browser updates require an intentional baseline refresh in the same dependency change.

Fixtures use local artwork and fixed text. Tests wait for fonts and images; motion is disabled for captures, and motion behavior is exercised separately. Reports and traces are CI artifacts. Avoid arbitrary sleeps, fixed live dates and remote CMS assets.

Visual CI runs on the pinned macOS 26 arm64 runner to match the reviewed Darwin snapshots; unit and tarball jobs also run on Linux. Browser behavior still runs in Chromium and WebKit. [Runner availability](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

### Base UI focus guard exception

The cross-engine axe helper excludes only `[data-base-ui-focus-guard]`. Base UI intentionally exposes these invisible sentinels as buttons in Safari so VoiceOver swipes trigger focus redirection; adding aria-hidden breaks that behavior. Its maintainer recommends this precise exclusion ([upstream #5237](https://github.com/mui/base-ui/issues/5237)). All actual overlay content, controls, triggers and contrast rules remain checked. Keyboard trapping is tested independently. This is an automated-tool exception, not a claim that VoiceOver has been manually verified. Reassess it on Base UI upgrades.
