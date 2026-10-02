# Contributing

Use a branch and PR into main. Keep component changes cohesive and preserve unrelated work. Canonical implementation guidance is AGENTS.md and the shared skills.

For a component change: update the implementation/TSDoc, colocated stories, meaningful behavior tests and usage notes. Describe visual and accessibility impacts. Add a Changeset when public behavior, tokens or appearance changes. Prefer an existing variant over another near-duplicate component.

Run `bun run lint`, `bun run typecheck` and targeted Vitest tests while working. Before delivery run `bun run verify`, inspect the explorer at phone and desktop sizes and state manual-review limitations. Generated API documentation is rebuilt with `bun run manifests`; edit TSDoc instead of generated tables.

Commits use Conventional Commits with lowercase summaries and subjects no longer than 72 characters. Staged hooks use lint-staged and never format unrelated unstaged files. PRs require the Verify check and reviewed visual baselines. Dependency major upgrades are deliberate changes, not automatic merges.
