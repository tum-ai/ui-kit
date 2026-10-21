# Native Figma release sync

This development/private plugin applies the published `figma-scene.json` from `tum-ai/ui-kit` to the exact file configured in `design/figma.config.json`. It uses the ordinary Figma Plugin API and requires no API token or browser automation after installation.

It checks the latest stable release on launch and every five minutes while the plugin stays open. Closing the plugin stops execution; reopening it catches up. The public Plugin API does not launch this updater remotely while the editor is closed. Figma’s separate hosted MCP writer has different authentication and capability limits; see [remote operation](../../docs/figma.md#running-remotely). Keep one designated release listener open in the target document for prompt updates.

## Install once

1. Reuse the registered plugin ID `1687921594818732934` in `design/figma.config.json`. Only a new independent library needs a new Figma development-plugin registration. A different ID cannot read the previous plugin's document ledger.
2. Set `FIGMA_PLUGIN_ID` to that ID, or record the public ID as `pluginId` in `design/figma.config.json`.
3. Run `node figma/plugin/build.mjs` from the repository root. The build uses the repository's Bun toolchain. It bundles `design/figma.seed.json` when present; `FIGMA_SEED_LEDGER` overrides that input. `FIGMA_PLUGIN_OUTPUT` changes the default `artifacts/figma-plugin` destination.
4. Remove any registration-template entry from the development-plugin list before importing the generated `artifacts/figma-plugin/manifest.json`. Figma may resolve duplicate IDs to the starter folder. Removing that development entry does not delete the plugin source folder or its registered ID. Open the configured design file and run the plugin. The private-API manifest flag enables `figma.fileKey` in a registered local development plugin so the target is verified before mutation.
5. For release CI to attach a plugin ZIP, configure the same `FIGMA_PLUGIN_ID` repository variable. The scene and checksum are published independently of plugin registration. Publishing a private plugin through Figma is a separate administrative action; this build does not publish one.

If an earlier MCP-based import created native assets, preserve its real returned IDs in the seed. The engine updates those identities in place. Seed records without native fingerprints are refreshed from code before their first baseline is recorded. Unmapped names, missing identities and incompatible native types stop safely instead of cloning a second library.

## Release contract

Every accepted release must provide both `figma-scene.json` and `figma-scene.json.sha256`, with GitHub SHA-256 asset digests. The release workflow mirrors those exact bytes to the `figma-release-data` branch. The updater resolves that branch to one immutable commit and downloads both files through GitHub's CORS-enabled raw endpoint. Direct release-download redirects are not browser-readable from Figma. Mirrored content must match the release asset digests and sizes before any document writes. The plugin checks the checksum, configured repository and package, stable version against the release tag, source commit against that tag, `source.completeInventory === true`, `source.dirtyCheckout === false`, and every scene fidelity diagnostic. Incomplete or unsupported captures fail before writing. It downloads JSON data only; it never evaluates code from a release.

Native components, variant sets, editable text and rich text ranges, vector SVGs, image paints, Auto Layout, variables, aliases, bindings, text styles and effect styles use the same checked-in reconciliation engine as the MCP transport. A release updates known identities. Identical content preserves IDs and does not write managed canvas nodes. Removed exports and layers are retained and reported as deprecated. Unmanaged designer content is preserved. Deleting deprecated assets or publishing the Figma library remains a deliberate human action.

Figma color-variable bindings control the complete RGBA value, including alpha. A CSS opacity modifier therefore needs a derived color variable with the correct value in each mode. The engine checks the resulting bound paint alpha and fails explicitly if it differs from the captured source.

Text sizing is applied after geometry and variable bindings, because Figma resizing can reset it. Explicit CSS `nowrap` and captured single-line inline labels use intrinsic text sizing; paragraphs keep their captured wrapping width. Updating an older ledger verifies the existing fingerprint before migrating sizing in place. The updater checks painted glyph bounds against clipping ancestors and reports additional overflow instead of shrinking fonts or widening containers.

Managed native properties are fingerprinted. A manual edit to generated text, fills, bound variables, styles or owned geometry causes an explicit drift failure on replay, including a replay of the same release. Canvas placement of top-level library assets is designer-owned. Imported SVG roots retain their identity; changed SVG source replaces only known imported vector descendants, and fails if a designer inserted content inside those descendants.

## Checkpoints and recovery

The native wrapper stores shared document checkpoints under this plugin's private namespace on the document root. This API is supported in ordinary plugins; the restricted MCP runtime does not call it. Each content-addressed chunk stays below Figma's 100 kB entry limit. The checkpoint pointer changes only after all chunks have been written, and unchanged chunks are reused. A pending-batch journal is written before canvas mutations. Returned identities, including partial failures, are persisted before the outcome is acted on.

The shared lease and checkpoint comparisons detect conflicting sessions, but Figma plugin data does not provide an atomic distributed lock. Use one designated listener. A network timeout, stale or incomplete release cannot trigger a write. A stopped batch with an unknown outcome pauses automatic retries so it cannot create duplicate nodes.

Use **Export state** for recovery. Inspect the affected page and reconcile exact IDs before importing the corrected ledger. Import verifies node identities and drops imported release claims; the next sync validates the actual release and native state again. Never guess IDs or delete an unmapped node merely because its name resembles generated content. An import and a sync are mutually exclusive within the plugin.

## Verification boundary

`bunx vitest run --project unit figma` runs these checks against a stateful fake adapter:

- source validation and release integrity
- deterministic updates and unchanged replay
- drift detection and managed identity preservation
- shared checkpoint recovery

Those tests do not prove Figma rendering or library publication. Only an applied release, checked by reading the native nodes back, proves that a file is in sync.

Official references: [plugin execution](https://developers.figma.com/docs/plugins/how-plugins-run/), [manifest and private API](https://developers.figma.com/docs/plugins/manifest/), [document plugin data and its size limit](https://developers.figma.com/docs/plugins/api/properties/nodes-setplugindata/), [plugin network requests](https://developers.figma.com/docs/plugins/making-network-requests/).
