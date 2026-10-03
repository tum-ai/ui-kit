import { axe } from "@test/axe";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { FaqItem } from "./faq-list";
import { FaqSection } from "./faq-section";
import { stubMatchMedia, stubObservers } from "./testing";

// A tuple, so `items[0]` is known to exist.
const items: [FaqItem, FaqItem] = [
  { question: "Who can apply?", answer: "Every student in Munich." },
  { question: "Does it cost anything?", answer: "No, membership is free." },
];

describe("FaqSection", () => {
  beforeEach(() => {
    stubMatchMedia({ reducedMotion: true });
    stubObservers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("names the band by its h2 through the id-derived title id", () => {
    render(<FaqSection items={items} id="questions" title="Questions about joining" />);
    const region = screen.getByRole("region", { name: "Questions about joining" });
    expect(region).toHaveAttribute("id", "questions");
    expect(region).toHaveAttribute("aria-labelledby", "questions-title");
    expect(region).toHaveAttribute("data-tone", "paper");
    const title = screen.getByRole("heading", { level: 2, name: "Questions about joining" });
    expect(title).toHaveAttribute("id", "questions-title");
    // Every question sits one level below the section title.
    expect(
      within(region)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Who can apply?", "Does it cost anything?"]);
  });

  test("defaults the anchor to faq so links to #faq land on it", () => {
    render(<FaqSection items={items} />);
    const region = screen.getByRole("region", { name: "Frequently asked questions" });
    expect(region).toHaveAttribute("id", "faq");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "faq-title");
  });

  test("puts the eyebrow, title, lead and aside before the questions", async () => {
    const { container } = render(
      <FaqSection
        items={items}
        tone="mist"
        eyebrow="Membership"
        lead="Everything you need before you apply."
        aside={<a href="mailto:hello@example.com">Ask the team</a>}
      />,
    );
    const region = screen.getByRole("region", { name: "Frequently asked questions" });
    expect(region).toHaveAttribute("data-tone", "mist");
    expect(region).toHaveTextContent(
      /^MembershipFrequently asked questionsEverything you need before you apply\.Ask the team/,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  test("opens the default answer and toggles questions from the keyboard after the aside", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FaqSection
        items={items}
        defaultValue={[items[1].question]}
        aside={<a href="mailto:hello@example.com">Ask the team</a>}
      />,
    );
    const first = screen.getByRole("button", { name: "Who can apply?" });
    const second = screen.getByRole("button", { name: "Does it cost anything?" });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("No, membership is free.")).toBeVisible();

    // The heading column comes first in the tab order, then the questions.
    await user.tab();
    expect(screen.getByRole("link", { name: "Ask the team" })).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Every student in Munich.")).toBeVisible();
    // One answer open at a time.
    expect(second).toHaveAttribute("aria-expanded", "false");

    await user.keyboard(" ");
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();
  });
});
