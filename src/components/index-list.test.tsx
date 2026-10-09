import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { axe } from "../../test/axe";
import { IndexList, type IndexListItem } from "./index-list";

const items: IndexListItem[] = [
  {
    id: "research",
    title: "Research",
    description: "Papers and exchanges.",
    href: "/research",
    image: { src: "/assets/placeholder.svg" },
  },
  {
    id: "events",
    title: "Events",
    description: "Talks and hackathons.",
    detail: "Next: Makeathon",
    href: "/events",
    image: { src: "/assets/placeholder.svg" },
  },
];

/** The first rows of `items`, one per photo, showing these photos. */
function withPhotos(...images: NonNullable<IndexListItem["image"]>[]): IndexListItem[] {
  return images.flatMap((image, index) => {
    const item = items[index];
    return item ? [{ ...item, image }] : [];
  });
}

function activeRow() {
  return document.querySelector('li[data-active="true"]');
}

describe("IndexList", () => {
  test("renders one link per destination, named by its title", () => {
    render(<IndexList items={items} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/research", "/events"]);
    expect(screen.getByRole("heading", { level: 3, name: "Events" })).toBeInTheDocument();
  });

  test("the first row is active until another is hovered or focused", async () => {
    const user = userEvent.setup();
    render(<IndexList items={items} />);
    expect(activeRow()).toHaveTextContent("Research");

    await user.tab();
    await user.tab();
    expect(activeRow()).toHaveTextContent("Events");

    await user.hover(screen.getByRole("link", { name: /Research/ }));
    expect(activeRow()).toHaveTextContent("Research");
  });

  test("falls back to the first row when the active one leaves the list", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<IndexList items={items} />);
    await user.hover(screen.getByRole("link", { name: /Events/ }));
    expect(activeRow()).toHaveTextContent("Events");

    rerender(<IndexList items={items.slice(0, 1)} />);
    expect(activeRow()).toHaveTextContent("Research");
  });

  test("keeps the preview out of the accessibility tree", () => {
    const { container } = render(<IndexList items={items} />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(container.querySelectorAll("img").length).toBeGreaterThan(0);
  });

  test("requests photos as wide as they draw once cropped to the frame", () => {
    const { container } = render(
      <IndexList
        items={withPhotos(
          { src: "/photo.jpg", width: 1600, height: 900 },
          { src: "/photo.jpg", width: 800, height: 1200 },
        )}
      />,
    );
    const sizes = [...container.querySelectorAll("img")].map((img) => img.getAttribute("sizes"));
    expect(sizes).toEqual([
      // Thumbnails: a 5rem square; a 16:9 photo spans 16/9 of it, a portrait one only the square.
      "9rem",
      "5rem",
      // Preview: a 4:5 frame; 16:9 draws 16/9 ÷ 4/5 ≈ 2.2× its width, portrait 2:3 fits it.
      "(min-width: 1280px) 69rem, 85vw",
      "(min-width: 1280px) 31rem, 38vw",
    ]);
  });

  test("assumes a 3:2 landscape when a photo has no size", () => {
    const { container } = render(<IndexList items={withPhotos({ src: "/photo.jpg" })} />);
    expect(container.querySelector("img")?.getAttribute("sizes")).toBe("8rem");
  });

  test("has no axe violations", async () => {
    const { container } = render(<IndexList items={items} headingAs="h2" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
