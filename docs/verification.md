# Initial extraction verification

Verified locally on 2 October 2026 with Node 24.19.0 and Bun 1.4.2. Source: website PR #264, commit `d9f5f2f8671a8b6a568ed226f6e061ac1e79c4b1`. The source worktree and the original website's unrelated changes were preserved. Website adoption is not part of this delivery.

## Delivered

- One ESM package with 67 runtime exports and 90 public type exports, explicit shell/CSS/asset entry points, and preserved client boundaries.
- 266 stories in 46 files, generated prop/API documentation, brand guidelines and contribution guides in the explorer.
- CSS token/design manifests with 193 token declarations, stable export/story identities, variant args, render URLs and empty Figma mappings.
- 1,031 deterministic previews from every story and 24 resolved token contexts. Fluid typography retains both its CSS expression and readings at each reference width. Viewport-specific stories retain their declared widths.
- Bun/Node pins, frozen lockfile, ESLint/Prettier, agent guidance, Changesets, CI, npm trusted-publishing workflow and static Vercel configuration. No account connections were made.

## Automated results

`bun run verify` completed successfully after the final Dialog corrections.

| Check                                                  | Result                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Frozen dependency installation                         | Pass                                                                                                                             |
| ESLint, Prettier, TypeScript (including browser tests) | Pass                                                                                                                             |
| Unit/component tests                                   | 258 passed in 43 files                                                                                                           |
| Overall line coverage                                  | 93.25%; component/shell 80% and pure-helper 90% floors pass                                                                      |
| Storybook Chromium tests and strict axe                | 266 passed in 46 files                                                                                                           |
| Playwright Chromium/WebKit regressions                 | 34 passed, including 16 reviewed screenshot comparisons                                                                          |
| Production package and explorer builds                 | Pass                                                                                                                             |
| Public export/story coverage                           | All runtime exports mapped to stories or documented nonvisual entries                                                            |
| Isolated packed Next consumer                          | Production build, hydration, CSS, fonts, routing, local/remote images, fallbacks, dialogs, no-JS content and reduced motion pass |
| Full renderer export                                   | 1,031 previews; 24 token contexts                                                                                                |
| Extraction comparison                                  | Twelve representative components produce identical PNGs at 320, 390, 768 and 1440px                                              |

The comparison covers PageHero, Photo, Section, Container, SectionHeader, Actions, Button, ButtonLink, TextLink, StatGrid, QuoteCard and FaqSection with identical fixtures. It does not claim every possible composition is visually identical. Focus-token, Dialog-state and portability changes are described in [portability](portability.md).

Reviewed renders include the complete page at phone and desktop widths, tone foundations, and the source-comparison set. The Storybook manager and complete-page preview were also inspected interactively. Normal test runs compare the reviewed baseline files; only the initial baseline-generation run used snapshot updating.

The release tarball is `artifacts/tum-ai-ui-kit-0.1.0.tgz`. Machine-readable proof is in `artifacts/consumer.json`, `artifacts/parity/comparison.json`, `artifacts/design/index.json`, `coverage/coverage-summary.json` and the Playwright report. Generated artifacts are ignored by Git and can be recreated with the documented commands. The first complete [GitHub CI run](https://github.com/tum-ai/ui-kit/actions/runs/37008047722) passed on commit `bd36e0428c8c01f75ec76dfbfc74c629e463c59e`: quality, unit coverage, tarball consumer, browser stories, visual regressions and the aggregate Verify job. Current results remain available in the [CI runs](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml).

## Accessibility proof boundary

Automated checks do not establish complete WCAG conformance. The WebKit axe helper excludes only Base UI's internal focus guards, following the maintainer's explanation in [Base UI #5237](https://github.com/mui/base-ui/issues/5237). Actual controls, triggers, portal content and contrast checks stay enabled; focus trapping is tested independently.

Axe cannot resolve some gradient backgrounds. In the interactive complete-page preview it reported zero violations and one inconclusive contrast rule covering eight elements in the hero/footer. Those are manual-review items, not counted as established contrast passes.

| Manual check                                              | Status                 |
| --------------------------------------------------------- | ---------------------- |
| VoiceOver, including Safari focus-guard announcements     | Not performed          |
| 200% zoom / 400% reflow                                   | Not performed          |
| Forced-colors mode                                        | Not performed          |
| Physical iPhone Safari                                    | Not performed          |
| Gradient/image background contrast across rendered states | Requires manual review |

## External follow-up

The implementation is delivered through the GitHub repository. npm publication, Figma library creation, website adoption and hosting deployment are separate follow-up work. npm scope ownership/authentication and the trusted-publisher/environment setup remain owner tasks. The owner will connect Vercel later; no Vercel account was inspected. Actual Figma library generation and website adoption remain separate phases.
