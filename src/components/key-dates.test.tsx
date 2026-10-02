import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { type KeyDateItem, KeyDates } from "./key-dates";

const items: KeyDateItem[] = [
  {
    id: "opens",
    label: "Applications open",
    date: "28 Sep",
    dateTime: "2026-09-28",
    state: "past",
  },
  {
    id: "deadline",
    label: "Deadline",
    detail: "23:59, Munich time",
    date: "27 Oct",
    dateTime: "2026-10-27T23:59+01:00",
    state: "next",
    note: "in 26 days",
  },
  { id: "interviews", label: "Interviews", date: "2 - 8 Nov" },
];

describe("KeyDates", () => {
  test("pairs each label (term) with its date (definition)", () => {
    render(<KeyDates items={items} />);
    expect(screen.getAllByRole("term").map((node) => node.textContent)).toEqual([
      "Applications open",
      "Deadline23:59, Munich time",
      "Interviews",
    ]);
    expect(screen.getByText("27 Oct").closest("time")).toHaveAttribute(
      "datetime",
      "2026-10-27T23:59+01:00",
    );
  });

  test("tells screen readers which dates have passed", () => {
    render(<KeyDates items={items} />);
    expect(screen.getByText("28 Sep").closest("time")).toHaveTextContent("28 Sep (passed)");
    expect(screen.getByText("27 Oct").closest("time")).not.toHaveTextContent("passed");
  });

  test("shows the note only beside the next date", () => {
    render(<KeyDates items={items.map((item) => ({ ...item, note: `note ${item.id}` }))} />);
    expect(screen.getByText("note deadline")).toBeInTheDocument();
    expect(screen.queryByText("note opens")).toBeNull();
    expect(screen.queryByText("note interviews")).toBeNull();
  });

  test("draws the strikes only when asked, and only with motion allowed", () => {
    const still = renderToString(<KeyDates items={items} />);
    expect(still).not.toContain("animate-draw");
    const drawn = renderToString(<KeyDates items={items} drawIn />);
    expect(drawn).toContain("motion-safe:animate-draw");
  });

  test("has no axe violations", async () => {
    const { container } = render(<KeyDates items={items} size="lg" drawIn />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
