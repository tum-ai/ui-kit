# TUM.ai UI kit

[![CI](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/tum-ai/ui-kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@tum.ai/ui-kit)](https://www.npmjs.com/package/@tum.ai/ui-kit)
[![License: MIT](https://img.shields.io/badge/license-MIT-8052C2)](LICENSE)

The TUM.ai design system as a component library for Next.js. It ships brand tokens, six tone bands, accessible Base UI interactions, editorial page patterns and an optional website shell (header, footer, skip link). A Storybook explorer documents every component with live controls and accessibility checks.

## What's inside

| Area        | Contents                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations | Tone bands (`paper`, `mist`, `lavender`, `ink`, `night`, `violet`), Manrope type scale, spacing and focus                                                               |
| Components  | Buttons and links, typography, cards, media, logos, badges, accordions, dialogs, chips, figures and lists                                                               |
| Patterns    | `PageHero`, `SectionHeader`, `CtaBand`, `FaqSection`, `Steps`, `StatGrid`, `Ledger`, `KeyDates`, `IndexList`                                                            |
| Motion      | `Reveal`, `SplitWords`, `CountUp`, `Aurora`, `BrandMark`; all respect `prefers-reduced-motion`                                                                          |
| Shell       | `Header`, `Footer`, `SkipLink` from `@tum.ai/ui-kit/shell`, configured entirely through props                                                                           |
| Tokens      | Brand color scales and per-tone semantic colors as Tailwind 4 theme variables (`bg-violet-950`, `text-fg`, `var(--color-violet-500)`), type scale, easing and utilities |
| Styles      | `tailwind.css` (tokens and utilities), `fonts.css` (Manrope), `shell.css` (optional page shell behavior)                                                                |

## Installation

The package is published on npm as [`@tum.ai/ui-kit`](https://www.npmjs.com/package/@tum.ai/ui-kit). It requires Next.js 16, React 19 and Tailwind CSS 4 in the consuming application.

```sh
npm install @tum.ai/ui-kit
```

Install the peer dependencies if your application does not have them yet:

```sh
npm install next@^16 react@^19 react-dom@^19 tailwindcss@^4 @tailwindcss/postcss@^4
```

Other package managers work the same way:

```sh
pnpm add @tum.ai/ui-kit
yarn add @tum.ai/ui-kit
bun add @tum.ai/ui-kit
```

Before 1.0, minor versions may contain breaking changes (see [releases](docs/releasing.md)). Pin an exact version (`npm install --save-exact @tum.ai/ui-kit`) if you want to upgrade deliberately.

## Usage

Import the kit's styles after Tailwind in your global stylesheet, for example `app/globals.css`:

```css
@import "tailwindcss";
@import "@tum.ai/ui-kit/tailwind.css";
@import "@tum.ai/ui-kit/fonts.css";
/* Only when using the floating Header and page shell: */
@import "@tum.ai/ui-kit/shell.css";
```

The kit stylesheet registers its compiled JavaScript as a Tailwind class source, so no safelists or copied class lists are needed. `fonts.css` is optional if you load Manrope yourself (for example with `next/font`) and define `--font-manrope`.

Set up the root layout once:

```tsx
// app/layout.tsx
import "./globals.css";
import { MotionProvider } from "@tum.ai/ui-kit";
import { SkipLink } from "@tum.ai/ui-kit/shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>
          <div id="app-root" data-tone="paper">
            <SkipLink />
            {children}
          </div>
        </MotionProvider>
      </body>
    </html>
  );
}
```

Then compose pages from tone bands:

```tsx
// app/page.tsx
import { ButtonLink, Container, Heading, Section } from "@tum.ai/ui-kit";

export default function Page() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Section tone="ink">
        <Container>
          <Heading as="h1">Build with TUM.ai</Heading>
          <ButtonLink href="/about">About the project</ButtonLink>
        </Container>
      </Section>
    </main>
  );
}
```

Points to know:

- `#app-root` is the element that dialogs make inert while they are open. Portals mount outside it. Pass `backgroundRootId` if your root has a different ID.
- `SkipLink` targets `<main id="main-content" tabIndex={-1}>`.
- Components without event handlers are server-compatible. Keep `"use client"` to your own interactive modules.
- The shell components receive navigation, logos, CTAs and footer content as props. Routes, data fetching and remote image configuration stay in your application.

The full walkthrough is in [Getting started](docs/getting-started.md).

## Brand

The kit implements the TUM.ai brand: violet and indigo palette, Manrope, tone bands and the official logos. Read the [brand guide](docs/brand.md) before building new pages. The MIT license covers the code only; the TUM.ai name, logos and marks are covered by [brand asset terms](BRAND-ASSETS.md).

## Documentation

| Guide                                        | Covers                                                         |
| -------------------------------------------- | -------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)   | Installation, layout setup, local explorer, testing a tarball  |
| [Brand guide](docs/brand.md)                 | Palette, tones, typography, logos, imagery, do's and don'ts    |
| [Design system](docs/design-system.md)       | Principles, tokens, API conventions, components, motion rules  |
| [Component notes](docs/components)           | Contracts for foundations, media, compositions and the shell   |
| [Public API](docs/api.md)                    | Generated export reference                                     |
| [Portability decisions](docs/portability.md) | How the components stay independent of any one application     |
| [Engineering standards](docs/standards.md)   | Every enforced rule and the check that enforces it             |
| [Testing and accessibility](docs/testing.md) | Test layers, axe, visual baselines, manual checks              |
| [Browser quirks](docs/browser-quirks.md)     | Safari workarounds and where they live                         |
| [Figma library](docs/figma.md)               | Generating the native Figma library from code                  |
| [Releases](docs/releasing.md)                | Changesets, npm publishing and hosting the explorer            |
| [GitHub workflow](docs/repository.md)        | Branches, pull requests, CI and dependency updates             |
| [AI assistants](docs/ai-assistants.md)       | `AGENTS.md`, skills, subagents and hooks for coding assistants |

## Development

Use Node 24 and Bun 1.4.2 (see `.node-version` and `packageManager`). No environment variables or accounts are needed.

```sh
git clone https://github.com/tum-ai/ui-kit.git
cd ui-kit
bun install --frozen-lockfile
bun run dev
```

Storybook opens at <http://localhost:6006>. `bun run verify` runs the full CI-equivalent check; install its browsers first with `bunx playwright install --with-deps chromium webkit`. See [Contributing](CONTRIBUTING.md) for the workflow.

## Origin

The components were first built for the TUM.ai website redesign ([tum-ai/website_new#264](https://github.com/tum-ai/website_new/pull/264)) and are maintained here as a standalone package. [`extraction.json`](extraction.json) records the source revision.

## License

Code is released under the [MIT License](LICENSE). The Manrope font is licensed under the SIL Open Font License; see [third-party notices](THIRD-PARTY-NOTICES.md). TUM.ai identity assets are not covered by the MIT License; see [brand asset terms](BRAND-ASSETS.md).
