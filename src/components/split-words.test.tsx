import { render, screen } from "@testing-library/react";
import { Fragment } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { SplitWords } from "./split-words";

describe("SplitWords", () => {
  test("preserves readable headline content on the server", () => {
    const html = renderToString(
      <h1>
        <SplitWords>Build the future together</SplitWords>
      </h1>,
    );
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelector("h1")?.textContent).toBe("Build the future together");
    for (const word of document.querySelectorAll("h1 > span > span")) {
      expect(word.classList.contains("motion-safe:animate-rise")).toBe(true);
      expect(word.hasAttribute("aria-hidden")).toBe(false);
    }
  });

  test("flattens fragments while keeping a marked phrase as one unit", () => {
    render(
      <h1>
        <SplitWords delay={80} step={60}>
          <Fragment>
            Build {2} <strong>good things</strong>
          </Fragment>
        </SplitWords>
      </h1>,
    );
    expect(screen.getByRole("heading", { name: "Build 2 good things" })).toBeInTheDocument();
    const strong = screen.getByText("good things");
    expect(strong.tagName).toBe("STRONG");
    expect(strong.parentElement).toHaveStyle({ animationDelay: "200ms" });
    expect(strong.parentElement?.previousElementSibling).toHaveTextContent("2");
  });

  test("repeated words stay in the headline and each receives its own delay", () => {
    const { container } = render(
      <SplitWords delay={100} step={50}>
        Build build build
      </SplitWords>,
    );
    const words = container.querySelectorAll<HTMLElement>("span > span");
    expect(Array.from(words, (word) => word.textContent)).toEqual(["Build", "build", "build"]);
    expect(Array.from(words, (word) => word.style.animationDelay)).toEqual([
      "100ms",
      "150ms",
      "200ms",
    ]);
  });
});
