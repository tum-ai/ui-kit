import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TextLink } from "./text-link";

describe("TextLink", () => {
  test("opens a site route in the same tab without an arrow by default", async () => {
    const { container } = render(<TextLink href="/projects">Explore the projects</TextLink>);
    const link = screen.getByRole("link", { name: "Explore the projects" });
    expect(link).toHaveAttribute("href", "/projects");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(link.querySelector("svg")).toBeNull();
    expect(link).toHaveClass("text-highlight");
    expect(await axe(container)).toHaveNoViolations();
  });

  test("opens other sites in a new tab, says so and points the arrow out", async () => {
    const { container } = render(
      <TextLink href="https://example.com" arrow>
        Visit the website
      </TextLink>,
    );
    const link = screen.getByRole("link", {
      name: /^Visit the website\s?\(opens in a new tab\)$/,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const arrow = link.querySelector("svg");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
    expect(arrow).toHaveClass("lucide-arrow-up-right");
    expect(await axe(container)).toHaveNoViolations();
  });

  test("an internal arrow points forward", () => {
    render(
      <TextLink href="/join" arrow>
        Join
      </TextLink>,
    );
    const arrow = screen.getByRole("link", { name: "Join" }).querySelector("svg");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
    expect(arrow).toHaveClass("lucide-arrow-right");
  });

  test("external forces a new tab for a route", () => {
    render(
      <TextLink href="/studio" external arrow>
        Studio
      </TextLink>,
    );
    const link = screen.getByRole("link", { name: /^Studio\s?\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.querySelector("svg")).toHaveClass("lucide-arrow-up-right");
  });

  test("external={false} keeps an http(s) link in the same tab", () => {
    render(
      <TextLink href="https://example.com/docs" external={false} arrow>
        Docs
      </TextLink>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).not.toHaveAttribute("target");
    expect(link.querySelector("svg")).toHaveClass("lucide-arrow-right");
  });

  test("muted emphasis and anchor attributes reach the link", () => {
    render(
      <TextLink href="mailto:hello@example.com" emphasis="muted" aria-describedby="mail-help">
        Mail us
      </TextLink>,
    );
    const link = screen.getByRole("link", { name: "Mail us" });
    expect(link).toHaveClass("text-fg-muted");
    expect(link).not.toHaveClass("text-highlight");
    expect(link).toHaveAttribute("aria-describedby", "mail-help");
    expect(link).not.toHaveAttribute("target");
  });
});
