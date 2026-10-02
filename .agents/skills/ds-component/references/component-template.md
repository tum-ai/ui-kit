# Component template

A sketch of the conventions, not a component to copy verbatim. The header of
`src/index.ts` is authoritative; align with it and with the closest existing
component.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ElementType } from "react";
import { cn } from "../lib/cn";

/** Visual variants of {@link Callout}. Exported so other components can compose it. */
export const calloutStyles = cva("rounded-3xl p-6 relative border border-hairline text-fg", {
  variants: {
    /** Surface treatment. */
    variant: {
      raised: "bg-raised shadow-soft",
      plain: "bg-transparent",
    },
    /** Text colour of the body copy (never called `tone`: that is a band tone). */
    emphasis: {
      default: "text-fg",
      muted: "text-fg-muted",
    },
  },
  defaultVariants: { variant: "raised", emphasis: "default" },
});

export type CalloutProps = ComponentProps<"aside"> &
  VariantProps<typeof calloutStyles> & {
    /** Root element; defaults to `aside`. */
    as?: ElementType;
    /** Heading level of `title`; the visual size stays the same. */
    headingAs?: "h2" | "h3" | "h4";
    /** Short heading shown above the body. */
    title?: string;
  };

/**
 * A highlighted note inside a band. Reads the surrounding tone, so it works on
 * light and dark sections.
 */
export function Callout({
  as: Root = "aside",
  headingAs: Heading = "h3",
  title,
  variant,
  emphasis,
  className,
  children,
  ...props
}: CalloutProps) {
  return (
    <Root className={cn(calloutStyles({ variant, emphasis }), className)} {...props}>
      {title ? <Heading className="text-heading-sm">{title}</Heading> : null}
      {children}
    </Root>
  );
}
```

Checklist the template encodes:

- cva for every variant prop, with `defaultVariants`; no inline ternaries or const maps.
- `as` for the root element, `headingAs` for the heading level.
- `emphasis` for text colour; `tone` only on band components (`Section`).
- `ComponentProps` (ref as prop), exported `XProps`, `className` merged last with `cn`.
- TSDoc on the component, the styles and every added prop.
- Semantic tokens and type-scale utilities only; ESLint and Prettier sorts the classes.

Test sketch (`callout.test.tsx`):

```tsx
import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Callout } from "./callout";

describe("Callout", () => {
  test("renders the title at the requested heading level", async () => {
    const { container } = render(
      <Callout title="Deadline" headingAs="h2">
        Apply by Friday.
      </Callout>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Deadline" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
});
```
