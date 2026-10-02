# Code-driven Figma library

The target is [TUM.ai UI kit](https://www.figma.com/design/ULwF4tAlAKDsPzWdQ0jiBg), in the owner-selected Lanfermann workspace. CSS and TypeScript remain canonical. Configuration is in `design/figma.config.json`.

## Updates without Codex

GitHub generates `figma-scene.json` and its SHA-256 checksum whenever a stable `v<package version>` GitHub release is published. The release commit must belong to `main`. Generation runs Node, Bun and Chromium with the pinned dependencies. It needs no Codex, AI model, Figma token or hosting account.

The standalone Figma updater reads those public release assets and applies them to the existing file. It executes checked-in plugin code; downloaded JSON never becomes executable code. Launch the plugin to catch up, or leave it open to listen for subsequent releases. Closing Figma or the plugin stops the listener. Use one designated updater session at a time: the document lease detects ordinary overlap but Figma does not provide atomic locks across offline collaborators.

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

The local development plugin uses Figma's supported Plugin API and requires the desktop editor. Register a new development plugin in Figma and retain its assigned ID. Build using `FIGMA_PLUGIN_ID=<assigned ID> bun run figma:plugin`, then import the generated manifest into the desktop editor. Keep the same registration ID for every maintainer; it identifies the document-scoped generation ledger. The exact generated paths and controls are described in `figma/plugin/README.md`.

Set the same non-secret ID as GitHub repository variable `FIGMA_PLUGIN_ID` to include the ready-to-import updater in release artifacts. Never replace it with a guessed ID. No npm or Figma credentials belong in the plugin bundle.

For the initial file created through MCP, the updater must receive the verified seed ledger containing existing generated identities. Without that state, generation stops on conflicting names instead of duplicating components. Keep the checkpoint export with release evidence; never infer ownership merely from a component name.

## Identity, failures and ownership

Stable component and token keys map to native Figma IDs. Updating content does not create a new library file or replace existing component identities. Generated properties are owned by code. Add custom design explorations outside generated components; source changes may replace generated properties.

The plugin stores bounded ledger chunks on the document, so state travels with the file and is shared between registered plugin installations. Each batch records its checkpoint before continuing. An interrupted or uncertain write pauses automatic mutation; export recovery data and inspect the actual canvas before importing a reconciled checkpoint. Do not clear the ledger to make a failure disappear. Removed exports are reported as deprecations and retained for review, preserving existing instances.

Automated generation checks do not establish Figma visual parity or accessibility. Review representative native renders and edited instances after changes to the translator. Browser accessibility remains enforced by the source component tests. Native capture diagnostics explicitly describe unsupported or approximate effects.

Code Connect can be added after the native components are stable and published. It links implementation snippets to existing components; it does not generate or publish the library.
