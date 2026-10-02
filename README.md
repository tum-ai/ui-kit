# TUM.ai UI kit

[![CI](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml)

The TUM.ai design system as a Next.js-first component library. Six tone palettes, accessible Base UI interactions, editorial patterns and configurable website shells, with an executable Storybook reference.

Extracted from website PR #264 at the revision in [extraction.json](extraction.json). The website has not been migrated. This repository is the independent library; it does not fetch CMS content.

## Development

Use Node 24.19.0 and Bun 1.4.2. No environment variables or cloud accounts are required.

```sh
git clone https://github.com/tum-ai/ui-kit.git
cd ui-kit
bun install --frozen-lockfile
bun run dev
```

Storybook opens at `http://localhost:6006`. See [Getting started](docs/getting-started.md) for a complete application example and installation before the first npm release. Install test browsers with `bunx playwright install --with-deps chromium webkit` before running browser checks. Run `bun run verify` for the complete local/CI-equivalent validation. `bun run test:stories` runs actual browser interactions and axe. Unit tests use Vitest, not Bun's test runner.

## Consumer setup

The npm package name is provisional until TUM.ai confirms scope ownership and makes the first public release. You can use the package immediately from a built tarball; no registry or hosting setup is needed.

```sh
# In the cloned ui-kit repository:
bun run build
mkdir -p artifacts
npm pack --ignore-scripts --pack-destination artifacts

# In your Next.js application (replace the absolute path):
bun add /absolute/path/ui-kit/artifacts/tum-ai-ui-kit-0.1.0.tgz
```

`bun run test:consumer` builds and installs that same package format into an isolated Next application and verifies it in Chromium. The [CI package-reports artifact](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml) also contains the tested tarball for each successful run; it expires after 14 days. Build locally for a permanent copy.

```tsx
import { Button, Section, Heading } from "@tum-ai/ui-kit";
import { Header, Footer, SkipLink } from "@tum-ai/ui-kit/shell";
```

In the consumer's Tailwind 4 stylesheet:

```css
@import "tailwindcss";
@import "@tum-ai/ui-kit/tailwind.css";
@import "@tum-ai/ui-kit/fonts.css";
/* Only when using the floating header and website shell: */
@import "@tum-ai/ui-kit/shell.css";
```

The package registers its compiled JavaScript as a Tailwind class source. Keep the consumer's own normal source detection. Do not copy class safelists. Font loading is optional: consumers using `next/font` can omit `fonts.css` and define `--font-manrope` themselves.

Wrap page content in `id="app-root"` for dialog background inertness; portals mount outside it. Use a different `backgroundRootId` when needed. `SkipLink` targets a focusable `<main id="main-content" tabIndex={-1}>`. Add `MotionProvider` around consumers of the motion family. A server layout can pass its children through this client provider without turning every child into a client component.

Header/footer receive navigation, logos and content as props. Application routes, campaign clocks, data fetching, and remote image allowlists belong to the application. Core styles assume no fixed header; `shell.css` opts into header offsets, root canvas and Safari viewport behavior.

## Guides

- [Getting started](docs/getting-started.md) and [GitHub contribution workflow](docs/repository.md)
- [Design guidelines](docs/design-system.md) and [generated API](docs/api.md)
- [Accessibility and testing](docs/testing.md)
- [Figma preparation](docs/figma.md)
- [Releases and hosting](docs/releasing.md)
- [Contributing](CONTRIBUTING.md)
- [Initial verification and manual-review status](docs/verification.md)

MIT applies to implementation code. See [brand assets](BRAND-ASSETS.md) and [third-party notices](THIRD-PARTY-NOTICES.md) for separately covered identity material and fonts.
