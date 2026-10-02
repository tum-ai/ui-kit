# Figma automation: supported boundary

Evidence checked on 2026-10-02. CSS, TypeScript and rendered Storybook remain canonical. The production design must not require Codex after initial generation.

## Decision

Build a versioned native scene artifact automatically on release. A conventional Figma plugin consumes that data and reconciles one long-lived file through the public Plugin API. Subsequent updates need no Codex installation, model, MCP connection or Figma REST token: the plugin runs with the user's existing editor permissions.

Figma requires a user action to launch a plugin and explicitly excludes background plugins. The user opens the target file and runs the updater. A visible watch session may poll releases while it remains open, then catch up on the next launch. Closing the plugin or editor stops that session. No documented public route was found for a Codex-independent, unattended cloud worker to update native components while the editor is closed. [Plugin user actions](https://developers.figma.com/docs/plugins/#user-actions), [plugin lifetime](https://developers.figma.com/docs/plugins/how-plugins-run/).

Two completion states must remain separate: **the native file matches a release** and **the library version is published to subscribers**. Figma's official write documentation requires manual component publication before Code Connect can complete. File edits and Code Connect publication do not publish the component library. [Write limitations](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/#current-limitations).

## Capability and authentication evidence

| Surface                           | What it can do                                                              | What it does not establish                                                               |
| --------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Files/components REST API         | Read file trees, node IDs, renders and published component metadata         | General native node/component writes or a library-publish endpoint                       |
| Variables REST API                | Bulk create/update/delete local variables, collections and modes atomically | Component construction; access without Enterprise membership, scopes and edit permission |
| Conventional Plugin API           | Create/edit native components, variants, variables, styles and layouts      | A headless runtime or launch from a GitHub webhook                                       |
| Official remote MCP `use_figma`   | Write native file content through a supported client and Plugin API subset  | Codex-free service authentication merely by supplying a REST token                       |
| Code Connect CLI/MCP              | Publish implementation mappings for existing design components              | Generate or publish a component library                                                  |
| Generated import/release artifact | Preserve deterministic source data and evidence                             | Update a cloud Figma file merely by existing or being uploaded                           |

Primary references: [REST components](https://developers.figma.com/docs/rest-api/component-endpoints/), [Variables REST](https://developers.figma.com/docs/rest-api/variables-endpoints/), [Plugin API](https://developers.figma.com/docs/plugins/), [MCP tools](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/), [Code Connect CLI](https://developers.figma.com/docs/code-connect/quickstart-guide/).

The remote MCP uses interactive OAuth and admits only clients in Figma's catalog. REST personal/plan tokens do not establish MCP authorization. Figma's Organization/Enterprise plan tokens support REST automation, but do not add undocumented write operations or lift the Variables API's Enterprise restriction. No browser cookies, private endpoints, copied session credentials or client impersonation are acceptable integration dependencies. [Remote setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/), [REST authentication](https://developers.figma.com/docs/rest-api/authentication/).

Generative plugins are also editor resources with a UI, sandbox entrypoint and message bridge. Their public MCP authoring tools do not document a scheduler or headless execution endpoint. Publishing new plugin source and updating an existing design file are different operations. [Generative plugins](https://developers.figma.com/docs/figma-mcp-server/generative-plugins-and-shaders/).

## Release contract

The current manifest already provides stable public identities (`entry#export`), Storybook IDs, provenance, token expressions and aliases. Browser rendering provides reference screenshots and resolved values at 320/390/768/1440px. Those are inputs to the native scene; a screenshot alone is not an editable component.

1. Build from the exact release SHA and lockfile. Publish the validated scene, immutable release identity and content hash as one versioned artifact.
2. Fetch data only from the configured repository/origin. Bound response sizes, validate the scene schema and package, and compare release identity and hash before mutation. Do not download and evaluate JavaScript.
3. Run the checked-in reconciler inside the plugin. Validate its document binding and reconcile foundations before dependent pages, with sequential mutations.
4. Persist every returned identity, including known partial results. Journal an in-progress update so interruption cannot silently turn into duplicate creation.
5. Verify native types, properties, variable aliases/bindings and expected release identity. Use visual evidence for typography, geometry and state fidelity.
6. Report synchronization and library publication independently. Keep the latest verified release visible when fetching or applying a newer release fails.

Plugin networking can use its UI iframe and manifest domain allowlist; only sandbox code calls `figma.*`. Validate messages crossing that boundary. Plugin/source artifacts must contain no account tokens or private signed URLs. [Plugin execution model](https://developers.figma.com/docs/plugins/how-plugins-run/).

## Identity and interrupted updates

Store source identity → native ID in document-scoped plugin data, with an exportable ledger. Keep the plugin ID stable. `clientStorage` alone is insufficient: it belongs to a user's local client, so another teammate or device would lack the canonical mappings. Ordinary plugins support document plugin data; the MCP runtime's prohibition on `setPluginData` is specific to that runtime. [Plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setplugindata/), [client storage](https://developers.figma.com/docs/plugins/api/figma-clientStorage/).

The desktop development plugin enables `enablePrivatePluginApi` and checks the exact `figma.fileKey` before any write. Figma explicitly permits that flag for local plugins during development. A published public Community plugin cannot assume the same access and would need a separate document-binding design. Keep the registered plugin ID stable across local installations; a missing ledger or copied document is setup/recovery state. [File-key availability](https://developers.figma.com/docs/plugins/api/figma/#filekey), [local private-API support](https://developers.figma.com/docs/plugins/manifest/#enableprivatepluginapi).

Update components, sets, collections, variables, styles and significant children in place. Keeping a top-level component while replacing its children can still break instance overrides. Preserve component-property IDs too. Explicit rename mappings transfer identity; removals become reported deprecations rather than permission to delete arbitrary user content.

For variables, `id` and `key` are stable over the object's lifetime. The subscriber-facing `subscribed_id` changes when a modified variable is published and must not be used as canonical identity. [Variable identity](https://developers.figma.com/docs/rest-api/variables-endpoints/#get-published-variables).

The document ledger needs a crash-safe commit protocol, bounded/chunked storage, an in-progress journal and protection against concurrent plugin sessions. A cached release hash alone cannot prove the current canvas matches that release. Recovery must inspect exact native IDs/types and desired properties; missing or ambiguous objects block automatic recreation. Known partial results preserve the IDs already created and stop without marking the release complete.

Use one designated updater session. A document plugin-data lease can detect competing sessions in the state it observes, but it is not a server-side compare-and-set transaction and must not be described as a guaranteed distributed lock across delayed or offline collaborators.

## Initial-generation findings and rejected approach

Initial MCP work can create the file and native assets. Figma currently documents a 20KB output cap for `use_figma`, so that pilot uses bounded semantic batches and ledger deltas. A live `figma.io.write` probe returned only a path with no retrievable artifact; a path string is not durable ledger evidence. Font and image capabilities also require live checks because installed tool capabilities and the public limitations page differ. [MCP write limitations](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/#current-limitations).

A deterministic Codex app-server adapter was investigated and locally verified against its public `mcpServer/tool/call` schema. It could invoke exact scripts without a model turn, but would still require Codex at update time. That option and Codex heartbeat execution were rejected for production; the unused adapter and its tests were removed. The standalone plugin is the release executor. [Public protocol evidence](https://github.com/openai/codex/blob/main/codex-rs/app-server-protocol/src/protocol/common.rs).

## Acceptance boundary

- Run the plugin with Codex closed and consume a real release artifact.
- Run the same release twice without creating new managed identities.
- Update values/content while retaining component, variant, property and significant child IDs.
- Verify a second editor session or teammate reads the same document ledger.
- Reject malformed, oversized, wrong-package, stale and unverifiable release data before mutation.
- Interrupt an update, reopen the plugin and reconcile without duplicates or false success.
- Detect manual drift, missing/moved/deprecated assets and ambiguous identity matches; preserve unrelated content.
- Verify typography, geometry, viewport samples, variable bindings and representative states with native read-back and rendered evidence.
- Prove watch-mode catch-up after the plugin closes and reopens; describe it as foreground automation, not a background service.
- Keep publication pending until the separate supported library-publication step is completed.

Artifact generation passing in CI proves artifact generation. Plugin tests prove the tested reconciler and persistence behavior. Only an applied release with native read-back proves the cloud file synchronized; neither proves automatic library publication.
