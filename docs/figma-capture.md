# Rendered component capture

`scripts/figma/capture.mjs` converts the built Storybook inventory into the versioned native scene format in `figma/schema.mjs`. It uses Node and Playwright only. Capturing and regenerating release artifacts does not require Codex, an MCP session, a Figma account, or access to a published website.

Build Storybook and its manifests, serve that static directory, then capture:

```sh
bun run build:storybook
bun run manifests
node scripts/serve.mjs storybook-static 6006
# In another terminal:
node scripts/figma/capture.mjs --base-url http://127.0.0.1:6006 --strict
```

The default output is `artifacts/figma/capture.json`; reference PNGs are saved in the adjacent `previews/` directory. `--output` changes the artifact location. `--stories actions-button--primary,interactions-dialog--large` selects exact stable story IDs. Unknown IDs fail rather than producing an empty success. `--manifest` and `--tokens` accept alternate built manifest locations. A failed strict run still writes its diagnostic scene for investigation.

The capture CLI emits the visual scene without variable definitions. The release builder combines it with CSS token foundations. The programmatic `captureManifest()` accepts registered `variableKeys`; only those keys may be linked to paints and mode contexts. `captureStory()` accepts an existing Playwright page for focused investigation. `buildCaptureInventory()` can be used without launching a browser.

## Inventory and identity

One authored story produces one specimen at its explicit viewport width, or 1440 pixels when the story does not prescribe a width. Multiple public exports referencing the same story share that specimen. This avoids multiplying each story across six tones, four widths, and every compound-component export. Named responsive, disabled, open, and other authored stories remain separate states. Nonvisual exports and TypeScript-only types do not produce empty components.

`story:<storybook-id>` is the stable component identity. Descendant keys follow the rendered DOM structure, independently of React's generated IDs. Public export identities, story args, family, root tag, root role, tone, measured geometry, CSS values, and token provenance remain under `source`. The release builder can group coherent specimens into variant sets; a multi-control showcase should remain an example instead of becoming a single-control variant.

Single-root stories promote their actual rendered root into the component. A Button therefore has its actual button dimensions, without Storybook's padding or minimum canvas height. Composite stories retain their internal structure. Portalled dialogs retain a viewport-sized specimen with the visible trigger, scrim, and open dialog.

## Deterministic rendering

- Each story receives a fresh browser context, fixed locale, UTC timezone, scale 1, and reduced motion.
- Capture waits for `data-kit-ready="true"`, which Storybook sets after its play function. It then awaits fonts, eagerly decoded image fixtures, completed finite animations, and stable frame geometry. Transitions are disabled before temporary token probes.
- JavaScript is required to execute Storybook and its play functions. The scene describes that completed state; it is not evidence of a component's no-JavaScript or server-rendered behavior.
- The full visible body is inspected for Base UI portals, including zero-height portal wrappers. Inert or aria-hidden content is not discarded when it remains painted. Screen-reader-only text and focus sentinels are omitted from the visual scene.
- Original image bytes have SHA-256 evidence. Requests outside the configured Storybook origin are blocked by default. A programmatic caller can explicitly allow additional asset origins; those bytes must still be captured and reviewed.
- Browser native generated-content geometry comes from Chromium's box model. The capture does not infer pseudo-element positions from a screenshot.

## Editable primitives

Text blocks remain native editable text with fixed width and height auto-resize. Inline emphasis, colors, fonts, and authored line breaks are represented with rich text ranges. Browser line rectangles remain evidence in `source`; paragraphs are not split into one layer per screenshot line.

The exporter preserves native boxes, per-corner radii, solid and dashed strokes, solid/linear/radial fills, box shadows, blur, blend modes, vector SVGs, original image media, alpha masks, and the two-mask border-ring pattern as a gradient stroke. Inline SVGs receive computed presentation attributes before import, so `currentColor` and class-based icon styles survive independently of the browser stylesheet.

An outward focus outline remains visible even when its component clips overflowing content. An unclipped outer frame holds the outline beside the original clipped box; the component keeps its dimensions and applies opacity once. Removing the original content clip would incorrectly expose child media.

Gradient backgrounds honor their own CSS size, position, and repetition. A zero-width link underline paints nothing; a repeated dashed rail remains a clipped collection of editable native gradient tiles instead of one stretched fill. Unsupported background geometry fails explicitly.

Simple flex containers receive native Auto Layout. Grid, wrapping flex, margins, and safe alignment can remain editable fixed geometry where native reflow would alter the measured result. These cases emit `LAYOUT_GEOMETRY` warnings and retain the original CSS layout information. The exported scene preserves the selected viewport; it does not claim to reproduce the browser's entire responsive layout engine inside Figma.

Original SVG image assets containing filter-based noise, and image assets with CSS grayscale, are decoded individually into native PNG image fills. This preserves source image media without flattening any component, text, interaction, or page. `IMAGE_ASSET_DECODED` records that conversion. Plain vector assets remain native SVG.

Direct CSS-variable dependencies are proven by a temporary inline variable override followed by a computed-style comparison, then restored. Matching color values or matching selector names alone are not sufficient proof. Only registered `css:--name` identities are linked. `collection:tones` follows the nearest rendered `data-tone`; `collection:viewport` follows the specimen width.

## Fidelity and release gates

Every unsupported representation is recorded as an error and causes `--strict` to fail. Examples include unknown filters, custom clipping paths, unsupported image sizing, unavailable assets, and unhandled generated content. `validateScene()` rejects scenes with error diagnostics before any Figma mutation.

Warnings distinguish documented representation limits from capture failures:

| Code                   | Meaning                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `LAYOUT_GEOMETRY`      | Editable measured positions are preserved; native browser reflow is not reproduced.                       |
| `IMAGE_ASSET_DECODED`  | An original image asset was decoded into Figma-compatible image media.                                    |
| `DASH_DISTRIBUTION`    | Native dash proportions are preserved; browser corner distribution needs visual comparison.               |
| `NATIVE_LIST_MARKER`   | A native marker glyph uses Chromium's measured marker box; glyph appearance needs visual comparison.      |
| `EFFECT_APPROXIMATION` | Background blur is preserved; CSS backdrop saturation has no native equivalent and is explicitly omitted. |

A strict capture pass proves inventory completion and representability under these recorded limits. It does not prove pixel parity in Figma. The importer must validate available fonts, text wrapping, geometry, mask ordering, image tiling, and representative rendered output. Keep the source PNGs and diagnostics with the release artifact so changes can be audited without recreating an agent session.

Run the targeted parser, geometry, and inventory checks with:

```sh
bunx vitest run --project unit test/figma-capture.test.ts
```
