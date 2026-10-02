# Foundations and interactions

These are the kit's layout, typography, action and interaction primitives. Import public components from `@tum.ai/ui-kit`; the examples below omit imports for brevity. Components read semantic tokens from the surrounding band. `Section` owns `tone`, while `Text` and `TextLink` use `emphasis` to choose a text color within that tone. The six band tones are `paper`, `mist`, `lavender`, `ink`, `night`, and `violet`. Use violet bands for large statements.

| Family             | Runtime exports                                                                               | Variants and contracts                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layout             | `Container`, `Section`                                                                        | Container sizes: `default`, `wide`, `narrow`, `prose`. Section spacing: `none`, `sm`, `md`, `lg`, `xl`. Both accept semantic root elements through `as` and React 19 refs.                                                                                                                                                                                               |
| Typography         | `Display`, `Heading`, `Text`, `Eyebrow`, `Highlight`, `Prose`                                 | Visual size is independent of `as`. Display: `md`, `lg`, `xl`, `2xl`; Heading: `sm`, `md`, `lg`; Text: `lead`, `body`, `small`, `meta`. Text emphasis: `default`, `muted`, `subtle`. Highlight: `accent`, `fade`. Eyebrow accepts an optional sequence `index`.                                                                                                          |
| Actions            | `Button`, `ButtonLink`, `IconButton`, `buttonStyles`, `Actions`                               | Button variants: `primary`, `secondary`, `outline`, `ghost`, `inverse`, `link`; sizes: `sm`, `md`, `lg`, `icon`, `icon-sm`. `IconButton` requires `aria-label`. Actions aligns `start` or `center` and keeps wrapped items equally wide.                                                                                                                                 |
| Links              | `Anchor`, `TextLink`                                                                          | Internal routes use Next Link. HTTP(S) links open a new tab by default with a screen reader hint and `noopener noreferrer`. `external` overrides that choice. Email, phone, and fragment links use ordinary anchors. TextLink emphasis is `accent` or `muted`.                                                                                                           |
| Labels and content | `Pill`, `Tag`, `StatusBadge`, `IconBadge`, `BulletList`                                       | Pill sizes: `sm`, `md`, `lg`. Status states: `live`, `idle`, `closed`; its size matches an adjacent Button. IconBadge variants: `tint`, `soft`, `outline`, sizes: `sm`, `md`, `lg`, shapes: `square`, `circle`. Icons and status dots are decorative; adjacent text supplies meaning. BulletList accepts ordered React nodes, with unique text or explicit element keys. |
| Accordion          | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionPanel`                            | Base UI controls keyboard interaction and state. The trigger has `headingAs`. Panels stay in the DOM with `hidden="until-found"` so browser search can find closed answers.                                                                                                                                                                                              |
| Disclosure         | `Collapsible`, `CollapsibleTrigger`, `CollapsiblePanel`                                       | Base UI root props include controlled or default open state and disabled state. Compose the trigger with `render={<Button />}`.                                                                                                                                                                                                                                          |
| Dialog             | `Dialog`, `DialogTrigger`, `DialogClose`, `DialogContent`, `DialogTitle`, `DialogDescription` | Content variants: `modal`, `fullscreen`; sizes: `md`, `lg`, `xl`. Modal shows a corner close button by default; fullscreen expects a close action in its own content. Give every dialog a title and a useful description.                                                                                                                                                |

## Band and typography composition

```tsx
<Section tone="lavender" aria-labelledby="project-heading">
  <Container size="narrow">
    <Eyebrow>Our projects</Eyebrow>
    <Display as="h2" id="project-heading" size="md">
      Build with <Highlight>purpose.</Highlight>
    </Display>
    <Text size="lead">Explore ideas with people who make them useful.</Text>
    <Actions>
      <ButtonLink href="/projects" arrow>
        Explore projects
      </ButtonLink>
      <ButtonLink href="/contact" variant="outline">
        Contact the team
      </ButtonLink>
    </Actions>
  </Container>
</Section>
```

Use heading levels for the document outline and size props for visual hierarchy. Keep Manrope and the semantic tokens supplied by the package styles. Film grain is intended for dark bands. A status label states its condition in words; a live dot alone does not communicate the status.

## Dialog background isolation

`Dialog` adds `backgroundRootId?: string`, defaulting to `app-root`, to the source Base UI root API. The consumer places background content inside that element; DialogContent portals outside it. Storybook's global decorator supplies this root around each canvas, with portals in the document body.

```tsx
<div id="application-content">
  <Dialog backgroundRootId="application-content">
    <DialogTrigger render={<Button variant="outline" />}>Details</DialogTrigger>
    <DialogContent size="md" tone="paper">
      <div className="space-y-5 p-8">
        <DialogTitle>Project details</DialogTitle>
        <DialogDescription>Review the project before joining.</DialogDescription>
        <DialogClose render={<Button />}>Done</DialogClose>
      </div>
    </DialogContent>
  </Dialog>
</div>
```

Background inert applies only when `modal={true}`, the default. With `modal={false}`, Base UI allows interaction with the document; with `modal="trap-focus"`, it traps focus but keeps outside pointer interaction and scrolling available. The wrapper preserves both modes without acquiring background inert. An `onOpenChange` handler can call `details.cancel()` to reject an open or close request; canceled requests preserve the current open state and inert ownership.

Background ownership is counted per actual DOM element in a WeakMap. Separate roots release independently; nested dialogs sharing a root keep it inert until the final owner closes or unmounts. The final release restores the element's original inert state, including a pre-existing inert attribute. Changing the root ID releases the previous element and acquires the new one. If the ID is missing, Base UI's focus trap, Escape handling, and scroll lock still operate. An accepted close releases inert immediately so focus can return to the trigger.

Base UI owns focus trapping, focus restoration, keyboard interaction, and scroll locking. The background-isolation layer preserves those contracts. Keep the trigger in the chosen background root and avoid putting dialog portals inside it.

## Verification

The colocated DOM tests cover behavior and axe for Anchor, Button, BulletList, ChipGroup, Collapsible, Dialog, and StatusBadge. Additional Accordion tests cover keyboard activation, tab navigation, disabled semantics, searchable closed content, and axe. Dialog tests cover independent roots, existing inert state, nested owners, unmount cleanup, a replacement root, a missing root, canceled open and close requests, and changes between modal modes. Story plays exercise rendered interactions, including real arrow navigation and nested portal dialogs. jsdom axe does not prove visual contrast; browser story accessibility checks remain enabled for that verification.
