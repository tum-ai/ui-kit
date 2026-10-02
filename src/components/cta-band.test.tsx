import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CtaBand } from "./cta-band";
import { stubMatchMedia, stubObservers } from "./testing";

beforeEach(() => {
  stubMatchMedia({ reducedMotion: true });
  stubObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CtaBand", () => {
  test("renders the panel variant on the ink panel surface", async () => {
    const { container } = render(<CtaBand titleId="cta-title" title="Still have a question?" />);
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Still have a question?",
    });
    expect(heading.closest('[data-tone="ink"]')).not.toBeNull();
    expect(screen.getByRole("region", { name: "Still have a question?" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("draws flat ink without grain, and the mark only when asked", () => {
    const { container, rerender } = render(
      <CtaBand variant="band" titleId="band-title" title="Let's talk." />,
    );
    expect(container.querySelector(".grain")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();

    rerender(<CtaBand variant="band" titleId="band-title" title="Let's talk." mark={false} />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
