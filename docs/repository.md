# GitHub workflow

The canonical repository is [tum-ai/ui-kit](https://github.com/tum-ai/ui-kit). `main` is the only integration branch. The initial import bootstraps the empty repository; subsequent changes use short-lived branches and pull requests into `main`.

```sh
git switch main
git pull --ff-only
git switch -c feat/component-change
# Edit, verify, add a Changeset when needed, then stage only your change.
git add <changed-files>
git commit -m "feat(component): describe the change"
git push -u origin feat/component-change
```

Open a pull request using the supplied template. The [CI workflow](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml) aggregates formatting/lint/types, coverage, browser accessibility/visual checks, and the packed Next consumer into `Verify`. Review design and API changes with the [CODEOWNERS](../.github/CODEOWNERS) maintainer; include migration notes and a Changeset for public API/token/visual changes. `main` requires a pull request, one approving review, resolved conversations, and a successful `Verify` check on an up-to-date branch. New commits dismiss stale approvals; force pushes and branch deletion remain disabled. Administrator bypass is enabled at the owner's request; an admin may explicitly override the review requirement after checking CI. Use a Conventional Commit PR title; squash merging keeps a coherent history and source branches are deleted after merge.

CI reports and traces are attached to each run for 14 days. The `package-reports` artifact includes the tested tarball. The `browser-reports` artifact includes renderer smoke captures and browser traces/screenshots. Full reference renders remain reproducible with `bun run render:design`. Native Figma release bundles are generated with `bun run figma:build` and attached to stable GitHub releases by `figma.yml`; generated output is not committed.

Grouped Dependabot pull requests cover Bun and GitHub Actions dependencies. Dependency review runs on PRs. Dependency updates need the same checks and visual review as component changes; automatic merging is not enabled.

See [Contributing](../CONTRIBUTING.md), [testing](testing.md) and [releasing](releasing.md). Pushing or merging never publishes to npm or deploys the explorer. The npm publish workflow is manual and uses the `npm-publish` environment; see the release guide for the trusted-publisher configuration and approval step. Hosting remains owner-managed and deferred.

## Bun lockfile compatibility

Keep Bun pinned at 1.4.2. The lockfile intentionally uses the supported v1 serialization so GitHub's current Dependabot Bun reader can process it. The initial hosted run rejected v2 before checking dependencies ([upstream compatibility issue](https://github.com/dependabot/dependabot-core/issues/15848)). Converting the version marker and re-saving with the pinned Bun left all dependency records and integrity hashes unchanged; frozen installation was verified. Bun preserves this format on subsequent installs. Do not delete/regenerate the lockfile just to change dependencies. Once hosted Dependabot supports v2, the marker can be migrated separately with an unchanged dependency graph.
