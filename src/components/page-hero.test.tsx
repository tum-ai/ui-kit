import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PageHero } from "./page-hero";
import { stubMatchMedia, stubObservers } from "./testing";

beforeEach(() => {
  stubMatchMedia({ reducedMotion: true });
  stubObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PageHero", () => {
  test("renders the page's h1 and labels its band with it", async () => {
    const { container } = render(
      <PageHero
        titleId="hero-title"
        title="Community"
        lead="Who we are."
        actions={<a href="/apply">Become a Member</a>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Community" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Community" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("is a flat band, with no film grain", () => {
    const { container } = render(<PageHero title="Community" />);
    expect(container.querySelector(".grain")).toBeNull();
  });

  test("sets the whole title in the tone's accent with emphasis highlight", () => {
    render(<PageHero title="Community" emphasis="highlight" />);
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("text-highlight");
    expect(title).not.toHaveClass("text-fg");
  });
});
