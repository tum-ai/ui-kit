import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { StatGrid } from "./stat";
import { placeBelowFold, stubMatchMedia, stubObservers } from "./testing";

beforeEach(() => {
  stubMatchMedia();
  stubObservers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("StatGrid", () => {
  test("pairs each label (term) with its figure (definition)", () => {
    render(
      <StatGrid
        items={[
          { value: 2020, label: "Founded", grouping: false },
          { value: "1.2M+", label: "Reach" },
        ]}
      />,
    );
    const terms = screen.getAllByRole("term").map((node) => node.textContent);
    expect(terms).toEqual(["Founded", "Reach"]);
    expect(screen.getAllByRole("definition")[1]).toHaveTextContent("1.2M+");
  });

  test("counts numbers but leaves strings as they are by default", () => {
    placeBelowFold();
    const { container } = render(
      <StatGrid
        items={[
          { value: 900, suffix: "+", label: "Alumni" },
          { value: "2020", label: "Founded" },
        ]}
      />,
    );
    const figures = container.querySelectorAll("dd");
    expect(figures[0]?.querySelector('[aria-hidden="true"]')).toHaveTextContent("0+");
    expect(figures[1]).toHaveTextContent("2020");
  });

  test("`count` makes a string figure count up to its exact text", () => {
    placeBelowFold();
    const { container } = render(
      <StatGrid items={[{ value: "2,100+", label: "Members", count: true }]} />,
    );
    const figure = container.querySelector("dd");
    expect(figure?.querySelector('[aria-hidden="true"]')).toHaveTextContent("0+");
    expect(figure?.querySelector(".sr-only")).toHaveTextContent("2,100+");
  });

  test("sizes the figures with the stat tokens", () => {
    const { container } = render(<StatGrid size="sm" items={[{ value: 3, label: "Chapters" }]} />);
    expect(container.querySelector("dd")).toHaveClass("text-stat-sm");
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <StatGrid items={[{ value: 40, suffix: "+", label: "Nationalities" }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
