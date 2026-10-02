# Portability decisions

The kit must work in any Next.js application without application config, CMS clients or feature modules. This page records the contracts that keep it that way. Keep existing appearance and public APIs stable. Root exports come from src/index.ts; shell exports from src/shell/index.ts. Internal helpers are in src/components and src/lib. Stories must have explicit title and `parameters.kit.exports` naming every runtime export they document. Include `parameters.kit.tones` for supported bands. Use local `/assets/placeholder.svg` fixtures, never remote CMS or personal photos. Use Storybook `storybook/test` for plays. No story may disable accessibility checks.

Dialog: optional `backgroundRootId` default app-root; per-element inert counting preserves previous inert state. Header passes the same backgroundRootId through. Cancelled Base UI open/close requests leave ownership unchanged, and non-modal/trap-focus-only dialogs preserve background interaction.

Shell: Header receives navigation, connectLinks, cta, logo, homeHref/homeLabel, solid; keeps usePathname and local menu/scroll state. No clocks, CMS, campaigns, config or app facts. Footer receives logo, tagline, actions, columns and bottom-line content; synchronous server compatible. SkipLink takes targetId and label. Logo props must accept caller-supplied Next Image source, dimensions and alternative text, with no hardcoded asset URL.

Images: isUnoptimizedRemoteImage treats all http(s) remotes equally. Add explicit override where a family lacks it. The caller configures remotePatterns for optimized remote assets.

Focus outlines read a locally inherited `--tone-focus` token, so a light surface inside a dark band gets the light-surface ring and violet bands get a contrasting dark ring. Light tones reset `color-scheme` too. This avoids ancestor-selector leakage between nested tones. Motion is pinned to 13.5.0 to match its motion-dom dependency; 13.4.4 with a freshly resolved 13.5.0 motion-dom could not build.
