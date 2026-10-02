# Getting started

## Explore and develop

Install Node 24.19.0 and Bun 1.4.2, matching `.node-version` and `packageManager`. Then:

```sh
git clone https://github.com/tum-ai/ui-kit.git
cd ui-kit
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:6006>. Foundations explains the six tones and tokens; Components and Patterns contain live controls, props, examples and accessibility notes. Contribution documents the maintenance workflow. Storybook needs no `.env`, Sanity access, npm login or hosting connection. The install sets up this repository's Conventional Commit and staged-file hooks.

For a static local explorer:

```sh
bun run build:storybook
bun run manifests
node scripts/serve.mjs storybook-static 6006
```

Stop an existing dev server before starting the static server on the same port.

## Install in a Next.js application now

The initial verified combination is Next 16.3.6, React/React DOM 19.3.0 and Tailwind 4.3.3. Use compatible peer versions from `package.json`. Version 0.1.0 is available publicly on npm; installing it does not require npm login.

From your application:

```sh
bun add --exact @tum.ai/ui-kit@0.1.0
```

Commit your application's dependency and lockfile changes. Installing the raw Git repository as a dependency is not supported: compiled `dist` is deliberately not committed.

To test an unpublished change, run `bun run build` and `npm pack --ignore-scripts --pack-destination artifacts` in the kit checkout, then install the resulting tarball with `bun add /absolute/path/ui-kit/artifacts/tum.ai-ui-kit-0.1.0.tgz`. Keep a shared tarball in a stable project/vendor location when other developers or CI need it; a path to your personal checkout is not portable.

In `app/globals.css`, after the Tailwind import:

```css
@import "tailwindcss";
@import "@tum.ai/ui-kit/tailwind.css";
@import "@tum.ai/ui-kit/fonts.css";
```

Keep the usual Tailwind 4 PostCSS integration in the app. The kit stylesheet registers its packaged JavaScript for class detection; no source aliases or manually copied class lists are needed. `fonts.css` is optional when your app supplies `--font-manrope` through its own font loader.

A minimal server layout:

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

A minimal server page:

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

Add your own `/about` route for that link. Components with event handlers belong in a client module. Keep the root barrel as supplied; adding `"use client"` to every consumer defeats the server-compatible components. Dialog portals mount outside `app-root`, while their background inertness targets that ID; use `backgroundRootId` if your application uses a different root.

For the optional floating Header and Footer, also import `@tum.ai/ui-kit/shell.css` and follow [shell usage](components/shell.md). The application supplies navigation, logos, resolved CTAs and footer content. Copy approved identity files from `node_modules/@tum.ai/ui-kit/assets` to your app's `public` directory when using URL-based logos. Observe [brand terms](../BRAND-ASSETS.md). Remote optimized images require your application's Next image configuration; see [portability](portability.md).

The [Next consumer fixture](../examples/next-consumer) is an automated integration fixture: `bun run test:consumer` copies it, injects the tarball dependency and assets, and intercepts its intentionally invalid remote test URL. It is not a standalone app to run directly. Use the minimal layout/page above when starting an application.

## Verify changes

```sh
bunx playwright install --with-deps chromium webkit
bun run verify
```

This checks formatting, types, coverage, package/explorer builds, export coverage, browser stories, accessibility, visual regressions and the packed Next consumer. Visual baselines target macOS 26; GitHub runs that lane on the matching runner. Linux runs unit and package checks in CI. See [testing](testing.md) before intentionally updating snapshots. Passing automation does not replace the [outstanding manual accessibility checks](verification.md#accessibility-proof-boundary).

Hosting remains a separate, owner-managed setup step. See [Figma generation](figma.md) for the release-driven native library updater; no cloud connection is required to explore or install a locally packed kit.
