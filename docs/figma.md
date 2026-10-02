# Code-driven Figma library

The [TUM.ai UI kit Figma library](https://www.figma.com/design/ULwF4tAlAKDsPzWdQ0jiBg) is generated from this repository. CSS and TypeScript are the source of truth, and Figma mirrors them. Configuration lives in `design/figma.config.json`.

## Automatic release updates

Publishing a stable GitHub release tagged `v<package version>` triggers a workflow. It generates `figma-scene.json` and its SHA-256 checksum and attaches both to the release. The release commit must belong to `main`. Generation runs Node, Bun and Chromium with the pinned dependencies, and needs no Figma token or hosting account.

The standalone Figma updater plugin reads those public release assets and applies them to the existing library file. It runs checked-in plugin code; downloaded JSON never becomes executable code.

- Launching the plugin catches the file up to the latest release.
- Leaving the plugin open makes it listen for new releases.
- Closing Figma or the plugin stops the listener.
- Run one updater session at a time. The document lease detects ordinary overlap, but Figma offers no atomic locks across offline collaborators.

**Figma requires a person to launch plugins.** Its public plugin API has no server command that runs a plugin while the editor is closed. File updates are automatic only while the plugin is open. Publishing a library version to subscribers remains a separate, manual Figma action.

## Generate and inspect

```sh
bun install --frozen-lockfile
bunx playwright install chromium
bun run build:storybook
bun run manifests
bun run figma:build
bun run figma:plugin
```

The generator starts an isolated local Storybook server; `--base-url` reuses an existing one. For a focused diagnostic capture:

```sh
bun run figma:build --base-url http://127.0.0.1:6006 \
  --stories actions-button--primary,interactions-dialog--large
```

A filtered capture is explicitly incomplete, and the release updater rejects it. `--diagnostic` writes evidence even when fidelity errors exist, but it never produces an importable release asset from a failed capture. Generated output goes to `artifacts/figma/` and is not part of the npm package. The capture format is described in [rendered component capture](figma-capture.md).

Each scene records:

- the UI-kit Git commit, package version and source provenance
- story identities, original CSS expressions and resolved token contexts
- local asset digests and translation diagnostics

Production updates reject any of these: a mismatched package, repository, file, version, commit or checksum; an incomplete inventory; a mandatory fidelity failure. Fluid values keep their CSS expressions and their readings at 320, 390, 768 and 1440px. Tones use a separate six-mode variable collection.

## Install the updater

The updater is registered as Figma plugin `1687921594818732934`. Its ID is recorded in `design/figma.config.json` and in the GitHub repository variable `FIGMA_PLUGIN_ID`, so release builds share the same document ledger. Reuse this registration; a different ID cannot read the existing ledger.

1. Run `bun run figma:plugin`.
2. In Figma Desktop, choose **Plugins → Development → Import plugin from manifest** and select `artifacts/figma-plugin/manifest.json`.
3. Open the configured library file and run **TUM.ai UI kit release sync**.

If you created a registration template on the same computer, remove its starter entry from the development list first. Otherwise Figma can resolve the same ID to the starter folder.

The plugin bundle contains no npm or Figma credentials. Until a release with scene assets exists, the plugin waits without changing the canvas. Recovery controls are described in the [plugin README](../figma/plugin/README.md).

The library file was first populated through Figma's MCP server. The seed ledger in `design/figma.seed.json` maps those existing native IDs. Without it, generation stops on conflicting names instead of duplicating components. Never infer ownership from a component name alone.

## Identity, failures and ownership

Stable component and token keys map to native Figma IDs. Updates never create a new library file or replace existing component identities. Generated properties belong to the code. Make custom design explorations outside generated components, because source changes may replace generated properties.

The plugin stores the ledger in bounded chunks of document plugin data. The state travels with the file and every registered installation shares it. `clientStorage` alone would not work, because it is local to one user's client. Each batch records a checkpoint before continuing. An interrupted or uncertain write pauses automatic changes. Export the recovery data and inspect the actual canvas before importing a reconciled checkpoint. Don't clear the ledger to make a failure go away. Removed exports are reported as deprecations and kept for review, so existing instances survive.

## Design decisions and limits

Several Figma surfaces were evaluated. Only a conventional plugin can both build native components and run without extra accounts:

| Surface                   | Can do                                                                | Cannot do                                                   |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Files/components REST API | Read file trees, node IDs, renders and published component data       | Write native nodes or components, or publish a library      |
| Variables REST API        | Bulk create, update and delete variables, collections and modes       | Build components; it also requires an Enterprise plan       |
| Plugin API                | Create and edit native components, variants, variables and styles     | Run headless or start from a webhook                        |
| Figma MCP server          | Write native content from a supported, interactively signed-in client | Run as an unattended service authenticated by a token alone |
| Code Connect              | Link implementation snippets to existing components                   | Generate or publish a component library                     |

The release contract follows from this:

1. Build the scene from the exact release commit and lockfile. Publish the validated scene, its release identity and its hash together.
2. Fetch data only from the configured repository. Bound response sizes, and validate the schema, package, release identity and hash before any change.
3. Reconcile foundations before dependent pages, with sequential mutations, inside the plugin sandbox. Only sandbox code calls `figma.*`, and messages crossing the UI boundary are validated.
4. Persist every returned identity, including partial results, and journal in-progress updates so that an interruption cannot turn into duplicate creation.
5. Report synchronization and library publication separately. Keep the last verified release visible when a newer one fails.

Variable `id` and `key` values are stable over an object's lifetime and serve as identity. Published `subscribed_id` values change on every publish, so they are never used as identity. The development plugin enables `enablePrivatePluginApi` so it can check `figma.fileKey` before writing. A public Community plugin could not rely on that and would need a different document-binding design.

Automated generation checks do not establish visual parity or accessibility in Figma. After changing the translator, review representative native renders and edited instances. Browser accessibility is enforced by the source component tests.

The checks prove different things:

| Evidence                                 | What it proves                      |
| ---------------------------------------- | ----------------------------------- |
| CI artifact generation                   | The scene was generated             |
| Plugin tests                             | Reconciler and persistence behavior |
| An applied release with native read-back | The cloud file is in sync           |

None of these proves that the library was published to subscribers.

Code Connect can be added once the native components are stable and published.

References: [plugin execution](https://developers.figma.com/docs/plugins/how-plugins-run/), [plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setplugindata/), [Variables REST API](https://developers.figma.com/docs/rest-api/variables-endpoints/), [MCP write limitations](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/#current-limitations).
