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

Open a pull request using the supplied template. The [CI workflow](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml) aggregates formatting/lint/types, coverage, browser accessibility/visual checks, and the packed Next consumer into `Verify`. Review design and API changes with the [CODEOWNERS](../.github/CODEOWNERS) maintainer; include migration notes and a Changeset for public API/token/visual changes. Use a Conventional Commit PR title; squash merging keeps a coherent history and source branches are deleted after merge.

CI reports and traces are attached to each run for 14 days. The `package-reports` artifact includes the tested tarball. The `browser-reports` artifact includes renderer smoke captures and browser traces/screenshots. Full Figma-input renders remain reproducible with `bun run render:design`; generated build output is not committed.

Grouped Dependabot pull requests cover Bun and GitHub Actions dependencies. Dependency review runs on PRs. Dependency updates need the same checks and visual review as component changes; automatic merging is not enabled.

See [Contributing](../CONTRIBUTING.md), [testing](testing.md) and [releasing](releasing.md). Pushing or merging never publishes to npm or deploys the explorer. The npm publish workflow is manual and requires later account/environment setup. Hosting remains owner-managed and deferred.
