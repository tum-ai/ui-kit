#!/bin/sh
# Read-only feedback; staged hooks format files without touching other workers' edits.
set -eu
cd "$CLAUDE_PROJECT_DIR"
printf '%s\n' 'UI-kit edits: run bun run lint, bun run typecheck and the affected Vitest/story tests.'
