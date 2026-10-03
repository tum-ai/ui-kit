import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Container } from "./container";

describe("Container", () => {
  test("renders a centered div at the site grid width by default", () => {
    render(<Container data-testid="column">Content</Container>);
    const column = screen.getByTestId("column");
    expect(column.tagName).toBe("DIV");
    expect(column).toHaveClass("mx-auto", "w-[min(80rem,calc(100%-2*var(--gutter)))]");
  });

  test.each([
    ["wide", "w-[min(90rem,calc(100%-2*var(--gutter)))]"],
    ["narrow", "w-[min(60rem,calc(100%-2*var(--gutter)))]"],
    ["prose", "w-[min(46rem,calc(100%-2*var(--gutter)))]"],
  ] as const)("%s sets its own measure", (size, width) => {
    render(
      <Container data-testid="column" size={size}>
        Content
      </Container>,
    );
    const column = screen.getByTestId("column");
    expect(column).toHaveClass("mx-auto", width);
    expect(column).not.toHaveClass("w-[min(80rem,calc(100%-2*var(--gutter)))]");
  });

  test("renders the requested landmark and forwards its attributes", async () => {
    const { container } = render(
      <Container as="main" id="main-content" className="py-10">
        <h1>Page title</h1>
      </Container>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveClass("py-10", "mx-auto");
    expect(main).toContainElement(screen.getByRole("heading", { level: 1, name: "Page title" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
