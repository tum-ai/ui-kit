import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Section } from "./section";

describe("Section", () => {
  test("is a region named by its heading on the paper tone", async () => {
    const { container } = render(
      <Section aria-labelledby="about-title">
        <h2 id="about-title">About us</h2>
      </Section>,
    );
    const region = screen.getByRole("region", { name: "About us" });
    expect(region.tagName).toBe("SECTION");
    expect(region).toHaveAttribute("data-tone", "paper");
    expect(region).toHaveAttribute("data-band", "");
    expect(region).toHaveClass("py-20", "md:py-28");
    expect(await axe(container)).toHaveNoViolations();
  });

  test.each(["paper", "mist", "lavender", "ink", "night", "violet"] as const)(
    "%s sets the band tone",
    (tone) => {
      render(
        <Section tone={tone} aria-labelledby="title">
          <h2 id="title">Band</h2>
        </Section>,
      );
      expect(screen.getByRole("region", { name: "Band" })).toHaveAttribute("data-tone", tone);
    },
  );

  test("applies the spacing step, and none leaves padding to the caller", () => {
    const { rerender } = render(
      <Section spacing="xl" data-testid="band">
        Content
      </Section>,
    );
    expect(screen.getByTestId("band")).toHaveClass("py-28", "md:py-44");

    rerender(
      <Section spacing="none" data-testid="band" className="pt-40">
        Content
      </Section>,
    );
    const band = screen.getByTestId("band");
    expect(band).toHaveClass("pt-40");
    expect(band.className).not.toMatch(/\bpy-/);
  });

  test("adds a decorative grain layer only when asked", async () => {
    const { container, rerender } = render(
      <Section tone="night" data-testid="band" aria-labelledby="night-title">
        <h2 id="night-title">Night</h2>
      </Section>,
    );
    expect(container.querySelector(".grain")).toBeNull();

    rerender(
      <Section tone="night" grain data-testid="band" aria-labelledby="night-title">
        <h2 id="night-title">Night</h2>
      </Section>,
    );
    const grain = container.querySelector(".grain");
    expect(grain).toHaveAttribute("aria-hidden", "true");
    // The overlay sits before the content and adds no text.
    expect(screen.getByTestId("band").firstElementChild).toBe(grain);
    expect(grain).toBeEmptyDOMElement();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("renders the requested element", () => {
    render(
      <Section as="footer" tone="ink" data-testid="band">
        Footer copy
      </Section>,
    );
    const band = screen.getByTestId("band");
    expect(band.tagName).toBe("FOOTER");
    expect(band).toHaveAttribute("data-tone", "ink");
  });
});
