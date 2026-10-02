---
name: pr-ready
description: Pre-pull-request acceptance check for the TUM.ai UI kit. Use before opening or updating a PR, or when asked whether a branch is ready, to run full verification, review docs/API/package consistency and summarize real results and manual limitations.
---

# PR readiness

1. Run `bun run verify`. If it is too heavy for the machine, run the parts that apply and say which
   ones were skipped. CI's `Verify` check runs everything. The pre-push hook runs `typecheck` and
   `check:unused`; a failing push is not a reason to skip them. `docs/standards.md` lists every gate.
2. Confirm these agree with each other: the exports in `src/index.ts` and `src/shell/index.ts`,
   the stories (`parameters.kit.exports`), TSDoc, the generated `docs/api.md` (`bun run check:api` fails if it is stale)
   and `docs/components/*.md`.
3. Review package contents: after `bun run build`, run `bun run check:package` (publint, attw) and
   `bun run check:size` (raise a budget only with a reason in the PR), then
   `npm pack --ignore-scripts --dry-run`. Only
   `dist`, `assets`, `LICENSE`, `BRAND-ASSETS.md` and `THIRD-PARTY-NOTICES.md` should ship.
4. Check that a Changeset exists for any public API, token, visual or accessibility change.
5. Run the read-only reviewers on the affected files: `design-reviewer`, `a11y-reviewer` and
   `docs-sync`.
6. Write the PR summary using `.github/pull_request_template.md`. List the checks that actually ran
   and the manual checks that did not (see `docs/testing.md`).

Don't commit, push, publish or open the PR unless the user asks.
