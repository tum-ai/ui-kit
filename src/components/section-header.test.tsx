import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SectionHeader } from "./section-header";
import { stubMatchMedia, stubObservers } from "./testing";

beforeEach(() => {
  stubMatchMedia({ reducedMotion: true });
  stubObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SectionHeader", () => {
  test("sets a count after the title, inside the heading", async () => {
    const { container } = render(
      <SectionHeader
        id="upcoming-title"
        eyebrow="Calendar"
        index={1}
        title="Upcoming Events"
        count={4}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Upcoming Events (4)" })).toHaveAttribute(
      "id",
      "upcoming-title",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  test("shows a zero count", () => {
    render(<SectionHeader title="Past Events" count={0} />);
    expect(screen.getByRole("heading", { name: "Past Events (0)" })).toBeInTheDocument();
  });

  test("sets a page's lead statement in the largest display step", () => {
    render(<SectionHeader title="What is TUM.ai?" size="xl" headingAs="h3" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("text-display-xl");
  });
});
