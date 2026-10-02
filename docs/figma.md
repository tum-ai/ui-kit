# Code-driven Figma library

The target is [TUM.ai UI kit](https://www.figma.com/design/ULwF4tAlAKDsPzWdQ0jiBg), in the owner-selected Lanfermann workspace. CSS and TypeScript remain canonical. Configuration is in `design/figma.config.json`.

## Updates without Codex

GitHub generates `figma-scene.json` and its SHA-256 checksum whenever a stable `v<package version>` GitHub release is published. The release commit must belong to `main`. Generation runs Node, Bun and Chromium with the pinned dependencies. It needs no Codex, AI model, Figma token or hosting account.

The release workflow also commits byte-identical scene/checksum files under `releases/v<version>/` on the dedicated `figma-release-data` branch. GitHub release downloads currently omit the CORS headers required by Figma; the updater resolves the data branch to an immutable commit and reads through `raw.githubusercontent.com`. It checks the downloaded bytes against the GitHub release asset digests before applying them to the existing file. Existing version directories cannot be overwritten. No second hosting service is needed.

The standalone Figma updater applies this verified data. It executes checked-in plugin code; downloaded JSON never becomes executable code. Launch the plugin to catch up, or leave it open to listen for subsequent releases. Closing Figma or the plugin stops the listener. Use one designated updater session at a time: the document lease detects ordinary overlap but Figma does not provide atomic locks across offline collaborators.

**Figma requires user-initiated plugin execution.** Its public plugin API does not provide a server command that launches a plugin when the editor is closed. File updates can be automatic while the plugin is open; publishing a library version to subscribers remains a separate Figma action. See the [verified API boundary](figma-automation-research.md).

## Generate and inspect

```sh
bun install --frozen-lockfile
bunx playwright install chromium
bun run build:storybook
bun run manifests
bun run figma:build
bun run figma:plugin
```

The generator starts an isolated local Storybook server. `--base-url` reuses an existing server. For a focused diagnostic capture:

```sh
bun run figma:build --base-url http://127.0.0.1:6006 \
  --stories actions-button--primary,interactions-dialog--large
```

A filtered capture is explicitly incomplete and cannot be used by the release updater. `--diagnostic` writes evidence even when fidelity errors exist; it never produces an importable release asset from a failed capture. Generated outputs live under `artifacts/figma/` and are excluded from the npm package.

Each scene records the UI-kit Git commit, package version, extraction provenance, story identities, original CSS expressions, resolved token contexts, local asset digests and translation diagnostics. Production updates reject a mismatched package, repository, file, version, commit, checksum, incomplete inventory or mandatory fidelity failure. Fluid values keep their CSS expressions and readings at 320, 390, 768 and 1440px. Tones use a separate six-mode variable collection.

## Install the updater once

The updater is registered as plugin `1687921594818732934`. Its public ID is recorded in `design/figma.config.json` and the GitHub repository variable `FIGMA_PLUGIN_ID`, so release builds use the same document ledger. Maintainers should reuse this registration instead of creating another ID.

Run `bun run figma:plugin`, then import `artifacts/figma-plugin/manifest.json` in Figma Desktop under **Plugins → Development → Import plugin from manifest**. Open the configured library file and run **TUM.ai UI kit release sync**. If you created the registration template on this computer, remove its starter entry from the development list before importing the compiled manifest: Figma can otherwise resolve the same ID to the starter folder.

The first stable [release v0.1.0](https://github.com/tum-ai/ui-kit/releases/tag/v0.1.0) includes 266 captured stories across 11 component families, 182 variables, 76 text styles and 7 effect styles. Its source commit is `304d24a14b9aa2b2027de62c51094bb4082ce669`. Registration, local installation and file identity validation were verified in Figma Desktop on 2026-10-02. Native import verification is recorded separately from successful artifact generation. No npm or Figma credentials belong in its bundle. See `figma/plugin/README.md` for recovery controls.

For the initial file created through MCP, the updater must receive the verified seed ledger containing existing generated identities. Without that state, generation stops on conflicting names instead of duplicating components. Keep the checkpoint export with release evidence; never infer ownership merely from a component name.

## Identity, failures and ownership

Stable component and token keys map to native Figma IDs. Updating content does not create a new library file or replace existing component identities. Generated properties are owned by code. Add custom design explorations outside generated components; source changes may replace generated properties.

The plugin stores bounded ledger chunks on the document, so state travels with the file and is shared between registered plugin installations. Each batch records its checkpoint before continuing. An interrupted or uncertain write pauses automatic mutation; export recovery data and inspect the actual canvas before importing a reconciled checkpoint. Do not clear the ledger to make a failure disappear. Removed exports are reported as deprecations and retained for review, preserving existing instances.

Automated generation checks do not establish Figma visual parity or accessibility. Review representative native renders and edited instances after changes to the translator. Browser accessibility remains enforced by the source component tests. Native capture diagnostics explicitly describe unsupported or approximate effects.

Code Connect can be added after the native components are stable and published. It links implementation snippets to existing components; it does not generate or publish the library.

## Release-data maintenance

The workflow serializes data-branch writes. Its publisher verifies local bytes against already-uploaded release assets and the release tag before committing both files atomically. An identical retry is read-only; different content at an existing version fails. Reference updates never force-push. To backfill a previously published release after downloading its original assets:

```sh
node scripts/publish-figma-data.mjs v0.1.0 /path/to/original-release-assets
```

Keep only scene/checksum data on this branch. It does not affect the npm package or main's working tree, but its history adds Git storage; monitor growth before the 30 MiB scene limit becomes restrictive. Keep the registered updater installed from current main when fixing transport/runtime issues; the JSON schema and package identity remain independent of its bundle version.
