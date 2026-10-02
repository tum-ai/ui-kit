import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Anchor } from "./anchor";

describe("Anchor", () => {
  test("opens site routes in the same tab", () => {
    render(<Anchor href="/partners">Partners</Anchor>);
    const link = screen.getByRole("link", { name: "Partners" });
    expect(link).toHaveAttribute("href", "/partners");
    expect(link).not.toHaveAttribute("target");
  });

  test("opens other sites in a new tab and says so", async () => {
    const { container } = render(
      <Anchor href="https://example.com" className="footer-link">
        Example
      </Anchor>,
    );
    const link = screen.getByRole("link", {
      name: /^Example\s?\(opens in a new tab\)$/,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("footer-link");
    expect(await axe(container)).toHaveNoViolations();
  });

  test("keeps mail and in-page links as plain anchors", () => {
    render(
      <>
        <Anchor href="mailto:hello@example.com">Mail us</Anchor>
        <Anchor href="#faq">FAQ</Anchor>
      </>,
    );
    for (const name of ["Mail us", "FAQ"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute("target");
    }
  });

  test("opens a route in a new tab when forced", () => {
    render(
      <Anchor href="/studio" external>
        Studio
      </Anchor>,
    );
    expect(screen.getByRole("link", { name: /^Studio\s?\(opens in a new tab\)$/ })).toHaveAttribute(
      "target",
      "_blank",
    );
  });
});
