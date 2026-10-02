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
});
