import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { Ledger } from "./ledger";
import { stubMatchMedia, stubObservers } from "./testing";

beforeEach(() => {
  stubMatchMedia();
  stubObservers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Ledger", () => {
  test("pairs each label (term) with its figure and note (definitions)", () => {
    render(
      <Ledger
        items={[
          { label: "Founded", value: "2020", note: "At TUM" },
          { label: "Members", value: "1,000+" },
        ]}
      />,
    );
    expect(screen.getAllByRole("term").map((node) => node.textContent)).toEqual([
      "Founded",
      "Members",
    ]);
    expect(screen.getAllByRole("definition").map((node) => node.textContent)).toEqual([
      "2020",
      "At TUM",
      "1,000+",
    ]);
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <Ledger
        size="lg"
        items={[{ label: "Raised", value: 8, prefix: "€", suffix: "M+", note: "x" }]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
