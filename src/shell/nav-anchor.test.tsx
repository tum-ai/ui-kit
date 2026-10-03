import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { NavAnchor } from "./nav-anchor";

describe("NavAnchor", () => {
  test("uses the navigation label and forwards native anchor attributes", () => {
    render(
      <NavAnchor
        href="/projects"
        label="Projects"
        aria-current="page"
        className="custom-navigation"
      />,
    );
    const link = screen.getByRole("link", { name: "Projects" });
    expect(link).toHaveAttribute("href", "/projects");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveClass("custom-navigation");
  });
  test("announces external destinations and accepts composed link content", () => {
    render(
      <NavAnchor href="https://example.com" label="Example">
        <span>Example</span>
        <span aria-hidden>●</span>
      </NavAnchor>,
    );
    const link = screen.getByRole("link", { name: /^Example\s?\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  test("keeps fragments native and has no axe violations in a navigation list", async () => {
    const { container } = render(
      <nav aria-label="Primary">
        <ul>
          <li>
            <NavAnchor href="/projects" label="Projects" aria-current="page" />
          </li>
          <li>
            <NavAnchor href="#contact" label="Contact" />
          </li>
          <li>
            <NavAnchor href="https://example.com" label="Partner site" />
          </li>
        </ul>
      </nav>,
    );
    const fragment = screen.getByRole("link", { name: "Contact" });
    expect(fragment).toHaveAttribute("href", "#contact");
    expect(fragment).not.toHaveAttribute("target");
    expect(await axe(container)).toHaveNoViolations();
  });
});
