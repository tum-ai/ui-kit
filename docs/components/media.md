# Media and branding

Import components and their prop types from `@tum.ai/ui-kit`. They use the
consumer's Next.js Image runtime and the UI kit's semantic tone tokens.

| Export                   | Use and variants                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Photo`                  | Captioned `figure`, six aspect ratios including responsive panorama, rounded or bleed frame, focal position, eager LCP loading.                            |
| `PersonCard`             | 4:5 portrait, name heading, byline and supporting content. Set `headingAs` to fit the page hierarchy.                                                      |
| `QuoteCard`, `QuoteMark` | Semantic quotation and attribution, raised, glass, editorial or ruled. Portrait defaults to decorative alt text; organization logos need an alt.           |
| `LogoTile`, `LogoWall`   | Name fallback for missing or failed artwork, tile, chip, bare or mono; grid or equal-area wrapping strip. Optional wordmark avoids a duplicate image name. |
| `FallbackImage`          | Next Image props with an optional source and caller-supplied fallback. Failed sources retry when `src` changes.                                            |
| `IndexList`              | Link rows with decorative thumbnails on small screens and a sticky preview from `lg`; pointer and keyboard focus select the same row.                      |
| `BrandPanel`             | Decorative ink placeholder with three seeded compositions. Put it in a positioned, clipped image frame.                                                    |
| `BrandMark`              | Decorative official mark geometry, tonal or gradient, optional drift and dark-band intensity. Use the official asset for a real logo.                      |
| `Aurora`, `TopBlend`     | Decorative dark-band light and an eased top or bottom edge. Place in a `relative isolate` parent.                                                          |
| `SpotlightCard`          | Raised, outline, glass or plain surface, padding steps and optional hover lift. Put a real link or button inside for interaction.                          |
| `EmptyState`             | Live status region with optional decorative icon, guidance and a recovery action.                                                                          |

## Images and optimization

All absolute HTTP(S) image URLs bypass Next.js optimization by default. Local
assets retain Next.js defaults. This is host-neutral and keeps image-host
configuration out of the package. Pass `unoptimized={false}` to `Photo`,
`PersonCard`, `FallbackImage` or `LogoTile` to select optimization explicitly.
`IndexList` accepts `image.unoptimized`; each `QuoteCard` portrait or logo
accepts its own `unoptimized` field. `LogoWall` forwards each logo's override.

When enabling optimization for remote images, configure the consuming Next.js
app's `images.remotePatterns` to permit that host and path. The library does not
configure or allowlist external image hosts. `FallbackImage` also accepts
Next.js static image imports through its existing `src` prop.

```tsx
<Photo
  src={photoUrl}
  alt="Participants comparing two prototypes at a workshop"
  caption="Workshop, main laboratory"
  unoptimized={false}
/>
```

`Photo` and `PersonCard` require image data. `QuoteCard` can omit its images;
`IndexList` can omit per-row media; `LogoTile` and `FallbackImage` support missing
and failed artwork. Compose `FallbackImage` with `BrandPanel` when a photo's
absence is expected. Decorative placeholders must not replace meaningful
accessible copy: supply text alongside them or label the fallback's parent.

## Tone, motion and layout

Media, lists, empty states and raised cards read semantic tokens from the
surrounding band. Use glass cards, Aurora and TopBlend on ink or night. Use mono
logo strips on light bands; bare artwork must be suitable for its background.
The logo grid's large tiles can step down on small screens using `responsive`.
Keep factual photo captions separate from image descriptions.

Ambient motion uses `motion-safe` utilities; reduced motion stops drift and
light-field loops. Spotlight reacts to mouse or pen, while touch preserves the
plain surface. The surface supplies no interactive role: semantic controls
inside it provide keyboard access. IndexList's focus behavior matches hover.

The Storybook fixtures use only the kit's local placeholder and official logo.
DOM tests cover image recovery, optimization overrides, semantic alternatives,
focus selection and pointer behavior. Browser stories provide the rendered
accessibility and responsive verification lane.
