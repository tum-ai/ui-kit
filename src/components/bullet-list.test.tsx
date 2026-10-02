import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { BulletList } from "./bullet-list";

describe("BulletList", () => {
  test("lists each point in order", async () => {
    const { container } = render(
      <BulletList
        aria-label="Tracks"
        items={[
          "Department track: join a department.",
          <strong key="lab">Lab track: build a product.</strong>,
        ]}
      />,
    );
    expect(
      screen.getByRole("list", { name: "Tracks" }).querySelectorAll(":scope > li"),
    ).toHaveLength(2);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Department track: join a department.",
      "Lab track: build a product.",
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
