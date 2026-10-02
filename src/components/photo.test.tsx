import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { axe } from "../../test/axe";
import { Photo } from "./photo";

describe("Photo", () => {
  test("shows the photo as a figure captioned by its caption", async () => {
    const { container } = render(
      <Photo
        src="/assets/placeholder.svg"
        alt="A new batch gathered for a group photo"
        caption="Kickoff, May 16, 2025"
      />,
    );
    expect(screen.getByText("Kickoff, May 16, 2025").closest("figure")).toBe(
      screen.getByRole("figure"),
    );
    expect(
      screen.getByRole("img", {
        name: "A new batch gathered for a group photo",
      }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("lazy-loads by default and loads eagerly without a preload when asked", () => {
    const { rerender } = render(<Photo src="/a.webp" alt="A" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");

    rerender(<Photo src="/a.webp" alt="A" eager />);
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(document.head.querySelector('link[rel="preload"]')).toBeNull();
  });

  test("renders no caption element when there is no caption", () => {
    const { container } = render(<Photo src="/a.webp" alt="A" />);
    expect(container.querySelector("figcaption")).toBeNull();
  });
});
