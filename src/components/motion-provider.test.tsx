import { render, screen } from "@testing-library/react";
import { m } from "framer-motion";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MotionProvider } from "./motion-provider";
import { stubMatchMedia } from "./testing";

afterEach(() => vi.unstubAllGlobals());

describe("MotionProvider", () => {
  test("renders content on the server without adding a layout wrapper", () => {
    expect(
      renderToString(
        <MotionProvider>
          <p>Visible without JavaScript</p>
        </MotionProvider>,
      ),
    ).toBe("<p>Visible without JavaScript</p>");
  });

  test("provides the strict lazy-motion boundary used by m components", () => {
    stubMatchMedia({ reducedMotion: true });
    render(
      <MotionProvider>
        <m.div initial={false}>Motion is optional</m.div>
      </MotionProvider>,
    );
    expect(screen.getByText("Motion is optional")).toBeVisible();
  });
});
