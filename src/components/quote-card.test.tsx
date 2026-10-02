import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { axe } from "../../test/axe";
import { QuoteCard } from "./quote-card";

describe("QuoteCard", () => {
  test.each(["raised", "glass", "editorial", "ruled"] as const)(
    "%s: a figure with the quotation and who said it",
    async (variant) => {
      const { container } = render(
        <QuoteCard
          variant={variant}
          quote="Build it here."
          name="Ada Lovelace"
          byline="Founder"
          portrait={{ src: "/assets/placeholder.svg" }}
          logo={{ src: "/assets/tum_ai_logo_new.svg", alt: "TUM.ai" }}
        />,
      );
      const figure = screen.getByRole("figure");
      expect(figure).toHaveTextContent("Build it here.");
      expect(figure).toHaveTextContent("Ada Lovelace");
      expect(screen.getByText("Build it here.").closest("blockquote")).not.toBe(null);
      // The portrait is decorative: the caption already names the person.
      expect(screen.getByRole("img", { name: "TUM.ai" })).toBeInTheDocument();
      expect(screen.getAllByRole("img")).toHaveLength(1);
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  test("frames the portrait on its focal point", () => {
    const { container } = render(
      <QuoteCard
        quote="Build it here."
        name="Ada Lovelace"
        portrait={{ src: "/assets/placeholder.svg", position: "50% 20%" }}
      />,
    );
    expect(container.querySelector("img")).toHaveStyle({
      objectPosition: "50% 20%",
    });
  });
});
