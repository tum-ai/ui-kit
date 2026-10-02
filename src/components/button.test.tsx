import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { describe, expect, expectTypeOf, test, vi } from "vitest";

import { Button, ButtonLink, IconButton } from "./button";

describe("ButtonLink", () => {
  test("renders an internal route as a same-tab link", () => {
    render(<ButtonLink href="/apply">Become a Member</ButtonLink>);
    const link = screen.getByRole("link", { name: "Become a Member" });
    expect(link).toHaveAttribute("href", "/apply");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  test("opens an external URL in a new tab and says so", () => {
    render(<ButtonLink href="https://github.com/tum-ai">GitHub</ButtonLink>);
    const link = screen.getByRole("link", {
      name: /^GitHub\s?\(opens in a new tab\)$/,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("keeps anchors, mail and phone links in the same tab", () => {
    render(
      <>
        <ButtonLink href="#faq">FAQ</ButtonLink>
        <ButtonLink href="mailto:contact@tum-ai.com">Email us</ButtonLink>
      </>,
    );
    for (const name of ["FAQ", "Email us"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute("target");
    }
  });

  test("`external` forces the new-tab behavior for any URL", () => {
    render(
      <ButtonLink href="/files/report.pdf" external>
        Report
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: /^Report\s?\(opens in a new tab\)$/ })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  test("hides the arrow from assistive tech", () => {
    render(
      <ButtonLink href="/events" arrow>
        Events
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Events" });
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <ButtonLink href="https://example.com" arrow="external">
        Visit
      </ButtonLink>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Button", () => {
  test("runs its action on click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("stays focusable when disabled with focusableWhenDisabled", () => {
    render(
      <Button disabled focusableWhenDisabled>
        Next
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Next" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveAttribute("disabled");
  });
});

describe("IconButton", () => {
  test("requires an accessible label", () => {
    type Props = ComponentProps<typeof IconButton>;
    expectTypeOf<Props["aria-label"]>().toEqualTypeOf<string>();
    // @ts-expect-error: an icon-only button without a name is rejected.
    const unnamed = <IconButton>{null}</IconButton>;
    expect(unnamed).toBeTruthy();
  });

  test("is named by its label", async () => {
    const { container } = render(
      <IconButton aria-label="Close">
        <X aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
