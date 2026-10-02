# Page shell

Import `Header`, `Footer`, and `SkipLink` from `@tum.ai/ui-kit/shell`. The header is a client component using Next App Router's `usePathname`; the footer and skip link are synchronous and server compatible. Load `@tum.ai/ui-kit/tailwind.css`, `@tum.ai/ui-kit/fonts.css`, and `@tum.ai/ui-kit/shell.css` in your app layout. The caller supplies every destination, text value, action and branding image.

```tsx
import { Header, Footer, SkipLink } from "@tum.ai/ui-kit/shell";
import { ButtonLink } from "@tum.ai/ui-kit";

const logo = {
  src: "/assets/tum_ai_logo_new.svg",
  width: 1640,
  height: 406,
  alt: "TUM.ai",
};
const navigation = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="application-root">
      <SkipLink />
      <Header
        logo={logo}
        navigation={navigation}
        cta={{ href: "/join", label: "Join the project" }}
        connectLinks={[{ href: "mailto:hello@example.com", label: "Say hello" }]}
        homeLabel="TUM.ai home"
        backgroundRootId="application-root"
      />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer
        logo={logo}
        tagline="Build what comes next."
        actions={<ButtonLink href="/join">Join the project</ButtonLink>}
        columns={[{ id: "explore", title: "Explore", links: navigation }]}
        bottomLine={<p>Example community initiative</p>}
      />
    </div>
  );
}
```

## Header

`navigation` and `logo` are required. `connectLinks` defaults to an empty array and `cta` defaults to `null`. Pass an already resolved `NavLink` or update that prop when your application state changes; the kit has no campaign, scheduling or clock behavior. `homeHref` defaults to `/`, `homeLabel` to `Home`, `solid` to `false`, and `backgroundRootId` to `app-root`. Native header attributes and `className` target the fixed header element.

A `ShellLogo` accepts a Next Image URL or static import plus required numeric `width`, `height`, and `alt`. Set `unoptimized` when serving a remote source directly; configure Next's `remotePatterns` in the application when optimizing remote images. The header preloads its logo and loads the duplicate menu image lazily. Supplying `alt=""` is valid when the logo link's accessible name supplies the identity.

Internal navigation uses Next Link. External http(s) links open in a new tab with an announced hint; `external` overrides that choice. Mail, telephone and fragment links remain native. Route descendants highlight their parent's navigation entry; `/` matches only the home route. The pill always stays visible and becomes frosted beyond eight pixels of scrolling. `solid` makes it frosted from its initial render. A fragment CTA stays visible on narrow phones.

Below `xl`, the menu opens in the kit's fullscreen dialog. Focus is trapped, Escape and the close button dismiss it, and focus returns to its trigger. Any menu destination, CTA, secondary link or independently triggered route change dismisses it. The dialog makes the element named by `backgroundRootId` inert and restores its previous state when it closes. Keep the portal outside this background root; the kit's default body portal already does so.

The floating pill retains its gap below Safari's top edge. The menu keeps `h-lvh`, scrolling, overscroll containment and bottom padding of `100lvh - 100dvh`, so long menus remain reachable above browser toolbars. Long desktop navigation scrolls within the available pill width; mobile labels wrap and long entry sequences cap their entrance delay.

## Footer

`logo`, `tagline`, and `columns` are required. `actions` and `bottomLine` are optional React node slots. Actions are wrapped in `Actions` so wrapping buttons keep equal widths. Bottom-line children share the source's responsive row. Native footer attributes and `className` target its root. The footer retains its night tone, grain, quiet aurora, decorative mark, and bottom blend.

Each column has `{ id, title, links }`. Supply stable, page-unique IDs suitable for HTML identifiers; the list references `footer-${id}`. Changing or translating titles therefore preserves identity, and repeated headings are supported. Link labels and destinations are ordinary `NavLink` values. The footer does not fetch content and can be rendered directly from a server component.

## Skip link

Place `SkipLink` before other focusable content. `targetId` defaults to `main-content` and is supplied without `#`; `label` defaults to `Skip to content`. Native anchor attributes and `className` are forwarded. Give the consumer's main landmark the matching ID and `tabIndex={-1}` so activation moves focus into the page. The link appears on keyboard focus and removes its transition under reduced motion.

## Scope and checks

The shell contains no site facts. Logo URLs, navigation, calls to action, time-limited campaigns and content fetching all come in through props, and route-specific behavior such as image preloading stays in the application. Storybook uses local logo and placeholder assets with synthetic content and includes browser focus, active navigation, menu dismissal, long-menu scrolling and axe assertions. DOM tests cover custom props, stable IDs, background isolation, route changes, scroll cleanup and link semantics; pure threshold tests cover overscroll and direction independence.
