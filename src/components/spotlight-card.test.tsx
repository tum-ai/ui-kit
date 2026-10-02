import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { axe } from "../../test/axe";
import { SpotlightCard } from "./spotlight-card";

let frame: FrameRequestCallback | undefined;
beforeEach(() => {
  vi.stubGlobal(
    "PointerEvent",
    class extends MouseEvent {
      readonly pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? "mouse";
      }
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 7;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  frame = undefined;
  vi.unstubAllGlobals();
});

describe("SpotlightCard", () => {
  test("composes the ref, tracks a mouse position and clears light on leave", async () => {
    const ref = createRef<HTMLDivElement>();
    const moved = vi.fn();
    const left = vi.fn();
    const { container, unmount } = render(
      <SpotlightCard ref={ref} onPointerMove={moved} onPointerLeave={left}>
        <h3>Research tools</h3>
      </SpotlightCard>,
    );
    const card = container.firstElementChild as HTMLDivElement;
    expect(ref.current).toBe(card);
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      right: 110,
      bottom: 120,
      width: 100,
      height: 100,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });
    fireEvent.pointerMove(card, { pointerType: "mouse", clientX: 45, clientY: 75 });
    act(() => {
      frame?.(0);
    });
    expect(moved).toHaveBeenCalledOnce();
    expect(card.style.getPropertyValue("--spot-x")).toBe("35px");
    expect(card.style.getPropertyValue("--spot-y")).toBe("55px");
    expect(card.style.getPropertyValue("--spot-opacity")).toBe("1");
    fireEvent.pointerLeave(card, { pointerType: "mouse" });
    expect(left).toHaveBeenCalledOnce();
    expect(card.style.getPropertyValue("--spot-opacity")).toBe("0");
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    expect(ref.current).toBeNull();
  });
  test("touch still reaches the consumer handler without starting the light", () => {
    const moved = vi.fn();
    const { container } = render(<SpotlightCard onPointerMove={moved}>Content</SpotlightCard>);
    const card = container.firstElementChild as HTMLDivElement;
    fireEvent.pointerMove(card, { pointerType: "touch", clientX: 45, clientY: 75 });
    expect(moved).toHaveBeenCalledOnce();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(card.style.getPropertyValue("--spot-opacity")).toBe("");
  });
  test("keeps the surface semantic rather than adding an interactive role", () => {
    render(
      <SpotlightCard interactive>
        <a href="/research">Explore research</a>
      </SpotlightCard>,
    );
    expect(screen.getByRole("link", { name: "Explore research" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
