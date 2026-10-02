# AI coding assistants

The repository carries shared instructions for AI coding assistants, so that Claude Code, Codex and similar tools follow the same conventions as human contributors. Nothing here is required to contribute. You are responsible for every change you submit, whichever tool produced it.

## Layout

| Path                          | Read by                                 | Purpose                                                                  |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `AGENTS.md`                   | Codex, Claude Code and most other tools | Canonical project instructions: commands, architecture rules, agreements |
| `CLAUDE.md`                   | Claude Code                             | Imports `AGENTS.md` (`@AGENTS.md`); holds no separate content            |
| `.agents/skills/<name>/`      | Codex and other skill-aware tools       | Shared task procedures (`SKILL.md` plus `references/`)                   |
| `.claude/skills/<name>`       | Claude Code                             | Symlinks to `.agents/skills/<name>`, so both tools use the same files    |
| `.claude/agents/*.md`         | Claude Code                             | Read-only review subagents                                               |
| `.claude/rules/*.md`          | Claude Code                             | Short reminders loaded when matching paths are edited                    |
| `.claude/settings.json`       | Claude Code                             | Shared permissions, the edit hook and the TypeScript LSP plugin          |
| `.claude/hooks/check-edit.sh` | Claude Code                             | Lints or format-checks each edited file                                  |

Personal overrides belong in `.claude/settings.local.json`, which is gitignored.

## Skills

| Skill          | Use it to                                                                               |
| -------------- | --------------------------------------------------------------------------------------- |
| `ds-component` | Add or change a component, with its variants, stories, tests, TSDoc and usage notes     |
| `tumai-brand`  | Apply the TUM.ai palette, tones, type, logos and motion to any visual change            |
| `ui-verify`    | Check rendered results in real browsers: widths, focus, overlays, axe, visual baselines |
| `pr-ready`     | Run the pre-pull-request acceptance pass and summarize the real results                 |
| `release`      | Prepare a version: Changesets, version bump, publish workflow and GitHub release        |

The skills point to the human documentation (`docs/design-system.md`, `docs/brand.md`, `docs/testing.md`) instead of copying it, so there is one source for each rule.

## Review subagents

`design-reviewer`, `a11y-reviewer` and `docs-sync` are read-only. They report findings with file and line, and never edit. `pr-ready` runs all three on the affected files. You can also ask for one directly, for example "run the a11y-reviewer on the dialog changes".

## Guardrails

- **Permissions.** Lint, typecheck, test and read-only git commands are pre-approved. Reading `.env*` and `.vercel/`, force-pushing, and `npm publish`/`bun publish` are denied. Releases go through the protected GitHub workflow.
- **Edit hook.** After every edit, `check-edit.sh` runs ESLint (`.ts`, `.tsx`, `.mjs`) or Prettier in check mode (`.css`, `.md`, `.mdx`, `.json`, `.yml`) on that one file. On failure, the output goes back to the assistant. It never rewrites files; formatting happens in the staged-file Git hook.
- **Parallel agents.** `AGENTS.md` describes file ownership when several agents work at once, and asks them not to run heavy browser suites in parallel.

## Adding to the setup

- Put project knowledge in `AGENTS.md` or the human docs. A skill should be a procedure that points to them.
- Create a new skill under `.agents/skills/<name>/SKILL.md`, with a `description` that says when to use it. Then link it for Claude Code: `ln -s ../../.agents/skills/<name> .claude/skills/<name>`.
- Keep rules short and path-scoped. Keep subagents read-only unless there is a strong reason for them to edit.
- Assistant-facing text in this repository is public. Follow the same neutral wording as the rest of the docs.
