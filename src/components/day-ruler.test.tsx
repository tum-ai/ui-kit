import { axe } from "@test/axe";
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import { DayRuler } from "./day-ruler";
import { placeBelowFold, stubMatchMedia, stubObservers } from "./testing";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const ticks = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[style*='left']")).filter(
    (node) => !node.hasAttribute("data-today"),
  );

describe("DayRuler", () => {
  test("draws one tick per midnight, from the first day to the last", () => {
    const { container } = render(<DayRuler days={29} elapsed={3} />);
    const positions = ticks(container).map((node) => node.style.left);
    expect(positions).toHaveLength(30);
    expect(positions[0]).toBe("0%");
    expect(positions.at(-1)).toBe("100%");
  });

  test("fills to today's tick and puts the mark on it", () => {
    const { container } = render(<DayRuler days={20} elapsed={5} />);
    const fill = container.querySelector<HTMLElement>("[data-fill]");
    const today = container.querySelector<HTMLElement>("[data-today]");
    expect(fill?.style.width).toBe("25%");
    expect(today?.style.left).toBe("25%");
  });

  test("clamps a day outside the window to its ends", () => {
    const { container, rerender } = render(<DayRuler days={10} elapsed={-2} />);
    expect(container.querySelector<HTMLElement>("[data-today]")?.style.left).toBe("0%");
    rerender(<DayRuler days={10} elapsed={14} />);
    expect(container.querySelector<HTMLElement>("[data-today]")?.style.left).toBe("100%");
  });

  test("sets the mark's label over the mark, flush near the edges", () => {
    const label = (elapsed: number) => {
      const { container, unmount } = render(
        <DayRuler days={20} elapsed={elapsed} markLabel="Today" />,
      );
      const node = container.querySelector<HTMLElement>("[data-mark-label]");
      const result = { left: node?.style.left, right: node?.style.right };
      unmount();
      return result;
    };
    expect(label(10)).toEqual({ left: "50%", right: "" });
    expect(label(1)).toEqual({ left: "0px", right: "" });
    expect(label(19)).toEqual({ left: "", right: "0px" });
  });

  test("draws in only with drawIn, and its server HTML is fully drawn", () => {
    expect(renderToString(<DayRuler days={14} elapsed={3} />)).not.toContain("data-draw");
    const html = renderToString(<DayRuler days={14} elapsed={7} drawIn />);
    expect(html).toContain('data-draw="idle"');
    expect(html).not.toContain("pending");
    expect(html).toContain("--tick-delay:300ms");
  });

  test("plays at once when it starts on screen", () => {
    stubMatchMedia();
    stubObservers();
    const { container } = render(<DayRuler days={14} elapsed={3} drawIn />);
    expect(container.firstElementChild).toHaveAttribute("data-draw", "idle");
  });

  test("waits below the fold until it scrolls into view", () => {
    stubMatchMedia();
    const { intersect } = stubObservers();
    placeBelowFold();
    const { container } = render(<DayRuler days={14} elapsed={3} drawIn />);
    const ruler = container.firstElementChild as HTMLElement;
    expect(ruler).toHaveAttribute("data-draw", "pending");

    act(() => intersect(ruler));
    expect(ruler).toHaveAttribute("data-draw", "done");
  });

  test("never holds anything back under reduced motion", () => {
    stubMatchMedia({ reducedMotion: true });
    stubObservers();
    placeBelowFold();
    const { container } = render(<DayRuler days={14} elapsed={3} drawIn />);
    expect(container.firstElementChild).toHaveAttribute("data-draw", "idle");
  });

  test("is hidden from assistive tech, labels included", async () => {
    const { container } = render(
      <DayRuler days={29} elapsed={3} startLabel="28 Sep" endLabel="27 Oct" markLabel="Today" />,
    );
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(await axe(container)).toHaveNoViolations();
  });
});
