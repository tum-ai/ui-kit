# Getting started

## Install in a Next.js application

The kit targets Next.js 16, React 19 and Tailwind CSS 4. Check the exact peer ranges in `package.json`. Install the package from npm:

```sh
npm install @tum.ai/ui-kit
```

If the application does not use Tailwind 4 yet, add it with its PostCSS plugin:

```sh
npm install tailwindcss@^4 @tailwindcss/postcss@^4
```

```js
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`pnpm add`, `yarn add` and `bun add` work the same way. Commit the dependency and lockfile changes. Installing the Git repository directly is not supported, because the compiled `dist` directory is not committed.

### Stylesheets

In `app/globals.css`, after the Tailwind import:

```css
@import "tailwindcss";
@import "@tum.ai/ui-kit/tailwind.css";
@import "@tum.ai/ui-kit/fonts.css";
```

The kit stylesheet registers its packaged JavaScript for class detection, so you need no source aliases and no copied class lists. Keep the application's own Tailwind source detection. `fonts.css` is optional when your app supplies `--font-manrope` through its own font loader.

### Root layout

```tsx
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

### A first page

```tsx
import { ButtonLink, Container, Heading, Section } from "@tum.ai/ui-kit";

export default function Page() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Section tone="paper">
        <Container>
          <Heading as="h1">Build with TUM.ai</Heading>
          <p>Shared foundations, components and patterns.</p>
          <ButtonLink href="/about">About the project</ButtonLink>
        </Container>
      </Section>
    </main>
  );
}
```

Add your own `/about` route for that link. Components with event handlers belong in a client module. Keep the root barrel as it is, because adding `"use client"` to every consumer defeats the server-compatible components.

Dialog portals mount outside `app-root`, while dialogs make that ID inert. Use `backgroundRootId` if your application uses a different root.

### Optional page shell

For the floating `Header` and `Footer`, also import `@tum.ai/ui-kit/shell.css` and follow the [shell notes](components/shell.md). The application supplies navigation, logos, resolved CTAs and footer content.

To use the official logo files by URL, copy them from `node_modules/@tum.ai/ui-kit/assets` into your app's `public` directory. Follow the [brand guide](brand.md) and the [brand asset terms](../BRAND-ASSETS.md).

Optimized remote images need the application's own Next.js `images.remotePatterns`; see [portability](portability.md).

## Explore the components locally

Install Node 24 and Bun 1.4.2, matching `.node-version` and `packageManager`. Then:

```sh
git clone https://github.com/tum-ai/ui-kit.git
cd ui-kit
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:6006>:

- **Start here** introduces the kit.
- **Foundations** explains the brand, the six tones and the tokens.
- **Components** and **Patterns** contain live controls, props, examples and accessibility results.
- **Contribution** documents the maintenance workflow.

The explorer needs no environment variables, CMS access or accounts. `bun install` also sets up the repository's commit-message, staged-file and pre-push hooks.

For a static build of the explorer:

```sh
bun run build:storybook
bun run manifests
node scripts/serve.mjs storybook-static 6006
```

Stop any running dev server first, because both use the same port.

## Test an unreleased change in your application

In the kit checkout:

```sh
bun run build
npm pack --ignore-scripts --pack-destination artifacts
```

Then install the resulting tarball in your application, for example `npm install /path/to/ui-kit/artifacts/tum.ai-ui-kit-<version>.tgz`. A path into one developer's checkout is not portable. If other developers or CI need the tarball, keep it somewhere shared.

The [Next consumer fixture](../examples/next-consumer) is an automated integration fixture, not a starter app. `bun run test:consumer` copies it, installs the packed tarball, builds it and exercises it in Chromium.

## Verify changes

```sh
bunx playwright install --with-deps chromium webkit
bun run verify
```

This checks:

- lint, formatting, types, unused code, the API reference and coverage
- the package and explorer builds, package lint (publint, attw), size budgets and export coverage
- browser stories, accessibility, motion audits and visual regressions
- the packed Next consumer

Visual baselines target macOS; CI runs that lane on a matching runner. See [testing](testing.md) before you update snapshots. Passing automation does not replace the [manual accessibility checks](testing.md#manual-accessibility-checks).
