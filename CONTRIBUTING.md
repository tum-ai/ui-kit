# Contributing

Thanks for helping improve the TUM.ai UI kit. Bug reports, accessibility findings, documentation fixes and component improvements are all welcome. By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and requests**: [open an issue](https://github.com/tum-ai/ui-kit/issues/new/choose) using one of the templates. Search existing issues first.
- **Security problems**: don't open a public issue; follow [SECURITY.md](SECURITY.md).
- **Larger changes**, such as a new component, a new variant family or a token change: open an issue first so the design can be agreed before you write code. Prefer extending an existing variant over adding a near-duplicate component.

## Set up

Use Node 24 and Bun 1.4.2 (see `.node-version` and `packageManager`):

```sh
git clone https://github.com/tum-ai/ui-kit.git   # or your fork
cd ui-kit
bun install --frozen-lockfile
bun run dev                                        # Storybook at http://localhost:6006
```

`bun install` installs the repository's Git hooks. They check Conventional Commit messages and format staged files with lint-staged. They never touch unstaged files.

## Make a change

Read the [design system](docs/design-system.md) and [brand guide](docs/brand.md) before UI changes. A component change usually touches all of these together:

- the implementation and its TSDoc (the [API reference](docs/api.md) is generated from TSDoc; never edit it by hand)
- colocated stories with an explicit `title` and `parameters.kit.exports`
- meaningful behavior tests
- the usage notes in `docs/components/`

While working, run:

```sh
bun run lint
bun run typecheck
bunx vitest run --project dom src/components/<file>.test.tsx
```

Before you open a pull request:

```sh
bunx playwright install --with-deps chromium webkit   # once
bun run verify
```

Then open the explorer at phone and desktop widths and check the affected stories. Testing details, visual baselines and the manual accessibility checklist are in [testing](docs/testing.md).

Add a Changeset (`bun run changeset`) when public behavior, tokens, appearance or accessibility change. Regenerate API documentation with `bun run manifests`.

## Commits and pull requests

- Commits and pull request titles use [Conventional Commits](https://www.conventionalcommits.org/) with a lowercase summary of at most 72 characters, for example `fix(dialog): restore focus after nested close`.
- Keep each pull request focused, and don't reformat unrelated files.
- Fill in the pull request template. Describe visual and accessibility impact, and list which manual checks you ran and which you didn't.
- The `Verify` check and a maintainer review are required. Pull requests are squash-merged.

The [GitHub workflow](docs/repository.md) describes CI, branch protection and dependency updates. [Releases](docs/releasing.md) explains how maintainers publish.

## Using AI coding assistants

The repository includes shared instructions for AI coding assistants: `AGENTS.md`, plus skills, review subagents and edit hooks. They work with Claude Code, Codex and similar tools. See [AI assistants](docs/ai-assistants.md). You are responsible for every change you submit, whatever tool produced it.
