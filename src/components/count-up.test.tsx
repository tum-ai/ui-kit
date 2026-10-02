import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import { CountUp } from "./count-up";
import { placeBelowFold, stubMatchMedia, stubObservers } from "./testing";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CountUp", () => {
  test("server HTML contains the final value without browser APIs or hydration", () => {
    const html = renderToString(<CountUp value={2100.5} prefix="€" suffix="M" decimals={1} />);
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelector('[aria-hidden="true"]')?.textContent).toBe("€2,100.5M");
    expect(document.querySelector(".sr-only")?.textContent).toBe("€2,100.5M");
  });

  test("renders the exact source text on the server and for screen readers", () => {
    stubMatchMedia();
    stubObservers();
    render(<CountUp value="1.2M+" />);
    expect(screen.getByText("1.2M+", { selector: ".sr-only" })).toBeInTheDocument();
  });

  test("formats numbers with prefix, suffix, decimals and grouping", () => {
    stubMatchMedia();
    stubObservers();
    render(<CountUp value={2100} prefix="~" suffix="+" />);
    expect(screen.getByText("~2,100+", { selector: ".sr-only" })).toBeInTheDocument();
  });

  test("starts a below-the-fold figure from zero in the source format", () => {
    stubMatchMedia();
    stubObservers();
    placeBelowFold();
    const { container } = render(<CountUp value="2,100+" />);
    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible).toHaveTextContent("0+");
    expect(screen.getByText("2,100+", { selector: ".sr-only" })).toBeInTheDocument();
  });

  test("keeps text that holds no single number as it is", () => {
    stubMatchMedia();
    stubObservers();
    placeBelowFold();
    const { container } = render(<CountUp value="24/7" />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("24/7");
  });

  test("does not animate under reduced motion", () => {
    stubMatchMedia({ reducedMotion: true });
    stubObservers();
    placeBelowFold();
    const { container } = render(<CountUp value="1.2M+" />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("1.2M+");
  });
});
