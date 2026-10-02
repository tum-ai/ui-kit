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

  test("has no axe violations", async () => {
    const { container } = render(<IndexList items={items} headingAs="h2" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
