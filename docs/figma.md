# Code to Figma preparation

CSS and TypeScript remain canonical. No Figma file or library is created in this phase.

1. `bun run build:storybook && bun run manifests` generates `design/manifest.json` and `design/tokens.json` inside the static explorer. The public catalog is derived from TypeScript exports, story metadata and Storybook's actual index.
2. `bun run render:design` exports screenshots and resolved token contexts to `artifacts/design`. Use `DESIGN_STORIES=id,id` to capture a small subset. Reference widths are 320, 390, 768 and 1440 pixels. Assets are local, fonts are awaited and motion is reduced.
3. Later, import primitive tokens and semantic tone mappings into Figma variables/styles. Preserve alias references. Fluid values retain their CSS expressions and separate viewport-specific readings.
4. Capture representative story render URLs, build editable components and variant sets, then map them to stable public export/story identities. Store future Figma node references in a separate mapping input rather than hand-editing generated JSON.
5. Review generated geometry, Auto Layout, responsive behavior and naming. A screenshot is reference evidence, not an editable component or an accessibility test.
6. Add Code Connect after components exist and the team's Figma plan supports it. It connects implementation snippets; it does not generate the library.

Generation must update known component identities and report removed/renamed exports. Do not clone a fresh library on every run. Manual library publishing and Figma access are outside this phase.

Set `STORYBOOK_BASE_URL` to the eventual explorer URL when generating canonical links. The default is local port 6006. Stable export identities and story IDs are used in `design/figma-links.json`; populate its empty mappings only after real Figma nodes exist. Variant args come from the typed CSF stories.

Stories with an explicit phone/tablet/desktop viewport are captured at that viewport; other stories use all four reference widths. The manifest records those restrictions, so responsive interaction plays remain meaningful. Story plays establish the rendered state, including opened dialogs.
