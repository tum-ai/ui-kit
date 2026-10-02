---
name: release
description: Prepare a release of @tum.ai/ui-kit, covering Changesets, version bump, changelog review, verification, the manual npm publish workflow and the GitHub release that generates the Figma library. Use when asked to release, version, publish or cut a new package version.
---

# Release

Follow `docs/releasing.md`. Every step that changes something outside the working tree
(push, PR, workflow dispatch, GitHub release) needs explicit authorization from the user.

1. Check that the pending Changesets in `.changeset/` cover every public API, token, visual and
   accessibility change since the last release (`git log v<last>..main`).
2. On a branch, run `bun run version:packages`. Review the version bump against the pre-1.0 policy
   (breaking changes bump the minor version and need migration notes) and review `CHANGELOG.md`.
3. Run `bun run verify`, then inspect the tarball with `npm pack --ignore-scripts --dry-run`.
4. Open the version PR. After it merges with a green `Verify` check, a maintainer runs the
   **Publish npm package** workflow on `main` (`gh workflow run publish.yml --ref main`) and
   approves the `npm-publish` environment.
5. After publishing, check `npm view @tum.ai/ui-kit version` and install the exact version in a
   consumer. Then create the GitHub release `v<version>` at the published commit
   (`gh release create v<version> --target <sha> --generate-notes`). It triggers the Figma scene
   generation.

Never run `npm publish` or `bun publish` locally, never republish an existing version, and never
create a prerelease or draft for the Figma pipeline (only stable releases generate scenes).
