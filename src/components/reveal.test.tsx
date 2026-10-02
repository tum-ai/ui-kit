import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import { Reveal } from "./reveal";
import { placeBelowFold, stubMatchMedia, stubObservers } from "./testing";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  test("server HTML is visible: idle, with no hiding state", () => {
    const html = renderToString(
      <Reveal as="section" delay={120}>
        Visible without JavaScript
      </Reveal>,
    );
    expect(html).toContain('data-reveal="idle"');
    expect(html).not.toContain("pending");
    expect(html).toContain("Visible without JavaScript");
    expect(html).toContain("--reveal-delay:120ms");
  });

  test("leaves content that starts on screen untouched", () => {
    stubMatchMedia();
    stubObservers();
    render(<Reveal>On screen</Reveal>);
    expect(screen.getByText("On screen")).toHaveAttribute("data-reveal", "idle");
  });

  test("hides content below the fold until it scrolls into view", () => {
    stubMatchMedia();
    const { intersect } = stubObservers();
    placeBelowFold();
    render(<Reveal variant="fade">Below the fold</Reveal>);
    const node = screen.getByText("Below the fold");
    expect(node).toHaveAttribute("data-reveal", "pending");
    expect(node).toHaveAttribute("data-reveal-variant", "fade");

    act(() => intersect(node));
    expect(node).toHaveAttribute("data-reveal", "done");
  });

  test("never hides anything under reduced motion", () => {
    stubMatchMedia({ reducedMotion: true });
    stubObservers();
    placeBelowFold();
    render(<Reveal>Calm</Reveal>);
    expect(screen.getByText("Calm")).toHaveAttribute("data-reveal", "idle");
  });

  test("renders the requested element and forwards the ref", () => {
    stubMatchMedia();
    stubObservers();
    const ref = createRef<HTMLLIElement>();
    render(
      <ul>
        <Reveal as="li" ref={ref}>
          Item
        </Reveal>
      </ul>,
    );
    expect(ref.current?.tagName).toBe("LI");
  });
});
