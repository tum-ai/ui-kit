import { axe } from "@test/axe";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { Steps } from "./steps";
import { stubMatchMedia, stubObservers } from "./testing";

beforeEach(() => {
  stubMatchMedia({ reducedMotion: true });
  stubObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const items = [
  { title: "collect project proposals," },
  { title: "recommend members to our partner labs,", number: "02A" },
  { title: "and support their journey abroad." },
];

describe.each(["columns", "rows"] as const)("Steps (%s)", (layout) => {
  test("is an ordered list with a numbered heading per step", async () => {
    const { container } = render(<Steps items={items} layout={layout} headingAs="h4" />);
    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps.map((step) => step.textContent)).toEqual([
      "01collect project proposals,",
      "02Arecommend members to our partner labs,",
      "03and support their journey abroad.",
    ]);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(3);
    expect(await axe(container)).toHaveNoViolations();
  });
});

test("rows show a step's description under its title", () => {
  render(
    <Steps layout="rows" items={[{ title: "Apply", description: "Tell us about yourself." }]} />,
  );
  expect(
    within(screen.getByRole("listitem")).getByText("Tell us about yourself."),
  ).toBeInTheDocument();
});

test.each(["columns", "rows"] as const)(
  "%s show a step's detail line under its title",
  (layout) => {
    render(<Steps layout={layout} items={[{ title: "Apply", detail: "Until 27 October" }]} />);
    expect(within(screen.getByRole("listitem")).getByText("Until 27 October")).toBeInTheDocument();
  },
);
