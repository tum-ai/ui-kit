#!/bin/sh
# PostToolUse feedback for a single edited file: ESLint for scripts, Prettier for
# styles and docs. It only checks; formatting stays with the staged-file Git hook,
# so other agents' unstaged edits are never touched. Exit 2 returns the output to
# Claude so it can fix the file; any other outcome is silent.
set -u
cd "$CLAUDE_PROJECT_DIR" || exit 0

file=$(node -e '
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const { realpathSync } = require("node:fs");
    const path = JSON.parse(input).tool_input?.file_path ?? "";
    // Canonical paths: macOS is case-insensitive, so the project dir and the
    // edited path can differ in letter case.
    const root = realpathSync.native(process.cwd());
    process.stdout.write(require("node:path").relative(root, realpathSync.native(path)));
  } catch {}
});
') || exit 0

case "$file" in
  "" | ../* | /* | node_modules/* | dist/* | storybook-static/* | coverage/* | artifacts/* | docs/api.md) exit 0 ;;
esac
[ -f "$file" ] || exit 0

case "$file" in
  *.ts | *.tsx | *.mjs) output=$(bunx --no-install eslint --max-warnings 0 --no-warn-ignored -- "$file" 2>&1) ;;
  *.css | *.md | *.mdx | *.json | *.yml | *.yaml) output=$(bunx --no-install prettier --check --ignore-unknown -- "$file" 2>&1) ;;
  *) exit 0 ;;
esac || {
  printf '%s\n%s\n' "Checks failed for $file (run 'bunx eslint --fix' or 'bunx prettier --write' on it):" "$output" >&2
  exit 2
}
exit 0
