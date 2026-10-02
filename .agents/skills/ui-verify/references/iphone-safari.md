# iPhone Safari checklist

For a real iPhone with Safari 26, against a hosted preview of the explorer or of an application that
uses the shell. The kit has workarounds for Safari's tinted status bar and toolbar (`docs/browser-quirks.md`, and the
comments tagged Safari in the code). Check each item on the pages or stories the change touches, in
portrait, and in landscape where noted.

## Page chrome

- [ ] **Status bar tint at the top:** on load, the status bar area is brand dark (the hero's
      colour), with no white or grey strip above the hero.
- [ ] **Status bar while scrolling:** after scrolling, the page shows through behind the status
      bar. The floating header does not tint it (it starts 12 px below the top on purpose).
- [ ] **Overscroll at the top:** pulling down past the top shows brand black, never white.
- [ ] **Bottom toolbar seam:** at the bottom of the page the footer runs into the toolbar area with
      no light line or colour step, with the toolbar both expanded and collapsed.
- [ ] **Overscroll at the bottom:** pulling up past the footer shows brand black.

## Header and mobile menu

- [ ] The header pill stays visible and legible over the hero and over light bands.
- [ ] Opening the menu: the dark panel covers the whole screen, and the status bar and toolbar
      both tint to the same dark colour; no page content shows below the panel.
- [ ] The last menu row can scroll above the toolbar (small phone and landscape).
- [ ] Closing with the close button returns focus and restores the scroll position; the page
      behind never scrolled while the menu was open.

## Dialogs

- [ ] The backdrop dims the areas behind the status bar and toolbar too.
- [ ] The dialog sits in the visible area, never under the toolbar, including after the toolbar
      collapses.
- [ ] Scrolling inside a long dialog doesn't scroll the page behind it.
- [ ] With a hardware keyboard (or VoiceOver), focus can't reach the page behind the dialog.

## Motion and type

- [ ] Hero headlines rise in without clipped descenders (g, p, y) or blur artefacts.
- [ ] Nothing stutters while scrolling past large animated sections.
- [ ] With Reduce Motion on (Settings, Accessibility, Motion), content appears without animation
      and marquees are static.

## Anchors

- [ ] In-page links land with the section title below the header, not hidden behind it.

Report each unchecked item with the page or story, orientation and a screenshot.
