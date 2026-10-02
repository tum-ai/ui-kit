# GitHub workflow

The canonical repository is [tum-ai/ui-kit](https://github.com/tum-ai/ui-kit). `main` is the only integration branch. All changes reach it through short-lived branches and pull requests. Contributors without write access work from a fork.

```sh
git switch main
git pull --ff-only
git switch -c feat/component-change
# Edit, verify, add a Changeset when needed, then stage only your change.
git add <changed-files>
git commit -m "feat(component): describe the change"
git push -u origin feat/component-change
```

Open a pull request using the template. Use a [Conventional Commit](https://www.conventionalcommits.org/) title; a check validates it. Pull requests are squash-merged, so the title becomes the commit on `main`.

## Checks and review

The [CI workflow](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml) runs four jobs and aggregates them into the required `Verify` check:

- **quality**: lint, formatting, types, unused code (knip) and the API reference matching TSDoc
- **unit**: unit and component tests with coverage
- **package**: publint and type-resolution checks, bundle size budgets, and the packed tarball installed into an isolated Next.js consumer
- **browser**: browser stories with axe, visual regressions and the Figma scene build

Pull requests into `main` need one approving review from a [code owner](../.github/CODEOWNERS), resolved conversations and a passing `Verify` check on an up-to-date branch. New commits dismiss stale approvals. Force pushes and branch deletion are disabled on `main`.

Include migration notes and a Changeset for public API, token or visual changes. Design and API changes should explain the visual and accessibility impact.

CI attaches reports to each run for 14 days:

- `unit-reports`: coverage
- `package-reports`: the tested tarball
- `browser-reports`: renderer captures, the Figma scene, Playwright traces and screenshots

Full reference renders are reproducible locally with `bun run render:design`.

## Dependencies

Dependabot opens grouped weekly pull requests for Bun and GitHub Actions dependencies. Dependency review runs on every pull request. Dependency updates go through the same checks and visual review as component changes, and nothing merges automatically. Major upgrades are deliberate changes.

### Bun lockfile compatibility

Keep Bun pinned at 1.4.2. The lockfile intentionally uses Bun's v1 text serialization, because Dependabot's Bun support cannot yet read v2 ([dependabot-core#15848](https://github.com/dependabot/dependabot-core/issues/15848)). Bun keeps this format on later installs. Don't delete and regenerate the lockfile just to change dependencies. Once Dependabot supports v2, the format can be migrated in a separate change that leaves the dependency graph unchanged.

## Publishing

Pushing or merging never publishes to npm or deploys the explorer. Releases are a separate, manually approved step; see [releasing](releasing.md). See also [Contributing](../CONTRIBUTING.md) and [testing](testing.md).
