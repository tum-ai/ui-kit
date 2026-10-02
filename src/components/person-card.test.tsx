import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { axe } from "../../test/axe";
import { PersonCard } from "./person-card";

describe("PersonCard", () => {
  test("names the portrait and the person, with the byline", async () => {
    const { container } = render(
      <PersonCard
        name="Ada Lovelace"
        byline="Head of Research"
        image={{ src: "/assets/placeholder.svg" }}
      />,
    );
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("Head of Research")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("serves the portrait as is and keeps the face in frame", () => {
    render(
      <PersonCard
        name="Ada Lovelace"
        image={{ src: "/assets/placeholder.svg", position: "50% 20%" }}
        unoptimized
      />,
    );
    const portrait = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(portrait).toHaveAttribute("src", "/assets/placeholder.svg");
    expect(portrait).toHaveStyle({ objectPosition: "50% 20%" });
  });
});
