import { axe } from "@test/axe";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { FaqList } from "./faq-list";
import { FaqSection } from "./faq-section";
import { stubMatchMedia, stubObservers } from "./testing";

const items = [
  { question: "Who can apply?", answer: "Every student in Munich." },
  { question: "Does it cost anything?", answer: "No, membership is free." },
];

describe("FaqList", () => {
  test("keeps all answers in server HTML with the requested default answer open", () => {
    const html = renderToString(<FaqList items={items} defaultValue={[items[0].question]} />);
    expect(html).toContain("Who can apply?");
    expect(html).toContain("Every student in Munich.");
    expect(html).toContain("No, membership is free.");
    const document = new DOMParser().parseFromString(html, "text/html");
    const open = document.querySelector('[aria-expanded="true"]');
    expect(open?.textContent).toContain("Who can apply?");
    const panelId = open?.getAttribute("aria-controls");
    expect(panelId && document.getElementById(panelId)?.hasAttribute("hidden")).toBe(false);
  });

  test("renders each question as a heading around a collapsed button", () => {
    render(<FaqList items={items} />);
    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Who can apply?",
    });
    const trigger = screen.getByRole("button", { name: "Who can apply?" });
    expect(heading).toContainElement(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("opens the answers named in defaultValue", () => {
    render(<FaqList items={items} defaultValue={[items[1].question]} />);
    expect(screen.getByRole("button", { name: "Who can apply?" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Does it cost anything?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("No, membership is free.")).toBeVisible();
  });

  test("keeps closed answers in the DOM as hidden until found", () => {
    render(<FaqList items={items} />);
    const answer = screen.getByText("Every student in Munich.");
    const panel = answer.closest("[hidden]");
    expect(panel).toHaveAttribute("hidden", "until-found");
  });

  test("opens and closes an answer with the keyboard", async () => {
    const user = userEvent.setup();
    render(<FaqList items={items} />);
    const trigger = screen.getByRole("button", { name: "Who can apply?" });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Every student in Munich.")).toBeVisible();

    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("reaches every question with Tab, skipping closed answers", async () => {
    const user = userEvent.setup();
    render(
      <FaqList items={[...items, { question: "Where?", answer: <a href="#map">On the map</a> }]} />,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Does it cost anything?" })).toHaveFocus();
    await user.tab();
    // The closed answer's link is hidden, so focus goes to the next question.
    expect(screen.getByRole("button", { name: "Where?" })).toHaveFocus();
  });

  test("uses the requested heading level", () => {
    render(<FaqList items={items} headingAs="h4" />);
    expect(screen.getAllByRole("heading", { level: 4 }).map((node) => node.textContent)).toEqual([
      "Who can apply?",
      "Does it cost anything?",
    ]);
  });

  test("keeps one answer open at a time", async () => {
    const user = userEvent.setup();
    render(<FaqList items={items} defaultValue={[items[0].question]} />);
    const [first, second] = screen.getAllByRole("button");
    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  test("has no axe violations", async () => {
    const { container } = render(<FaqList items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("FaqList deep links", () => {
  const linked = [
    { ...items[0], id: "who" },
    { ...items[1], id: "cost" },
  ];

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("gives each item its anchor id", () => {
    render(<FaqList items={linked} />);
    const trigger = screen.getByRole("button", { name: "Who can apply?" });
    expect(trigger.closest("#who")).not.toBeNull();
  });

  test("opens the item the URL fragment names on load", async () => {
    window.history.replaceState(null, "", "/#cost");
    render(<FaqList items={linked} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Does it cost anything?" })).toHaveAttribute(
        "aria-expanded",
        "true",
      ),
    );
  });

  test("opens an item with a percent-encoded id", async () => {
    window.history.replaceState(null, "", "/#joining%20details");
    render(<FaqList items={[{ ...items[0], id: "joining details" }]} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Who can apply?" })).toHaveAttribute(
        "aria-expanded",
        "true",
      ),
    );
  });

  test("an unrelated fragment leaves the reader's current answer open", () => {
    render(<FaqList items={linked} defaultValue={[items[0].question]} />);
    act(() => {
      window.history.replaceState(null, "", "/#other-section");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("button", { name: "Who can apply?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("ignores a fragment that is not valid percent-encoding", () => {
    window.history.replaceState(null, "", "/#100%");
    render(<FaqList items={linked} />);
    act(() => {
      window.history.replaceState(null, "", "/#%");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("opens an item when the fragment changes to it", () => {
    render(<FaqList items={linked} defaultValue={["Who can apply?"]} />);
    act(() => {
      window.history.replaceState(null, "", "/#cost");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("button", { name: "Does it cost anything?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "Who can apply?" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("brings the opened item back into view once it has opened", () => {
    vi.useFakeTimers();
    const scrolled: Element[] = [];
    const scrollIntoView = vi.fn(function (this: Element) {
      scrolled.push(this);
    });
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(<FaqList items={linked} defaultValue={["Who can apply?"]} />);
      act(() => {
        window.history.replaceState(null, "", "/#cost");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      // Once on the next frame, again after the closing answer collapsed.
      act(() => vi.advanceTimersByTime(1000));
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      expect(scrolled.every((node) => node.id === "cost")).toBe(true);
    } finally {
      vi.useRealTimers();
      // jsdom has no scrollIntoView of its own.
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  test("leaves the scroll alone when the named item is already open", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      window.history.replaceState(null, "", "/#who");
      render(<FaqList items={linked} defaultValue={["Who can apply?"]} />);
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  test("lets the reader close the linked item again", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/#cost");
    render(<FaqList items={linked} />);
    const trigger = screen.getByRole("button", {
      name: "Does it cost anything?",
    });
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("FaqList controlled", () => {
  function Controlled({ onValueChange }: { onValueChange: () => void }) {
    const [open, setOpen] = useState<string[]>([]);
    return (
      <>
        <p data-testid="open">{open.join(",")}</p>
        <FaqList
          items={items}
          value={open}
          onValueChange={(next) => {
            setOpen(next);
            onValueChange();
          }}
        />
      </>
    );
  }

  test("reports each change and renders the value it is given", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    const trigger = screen.getByRole("button", { name: "Who can apply?" });
    await user.click(trigger);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("open")).toHaveTextContent("Who can apply?");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("stays closed when the parent ignores the change", async () => {
    const user = userEvent.setup();
    render(<FaqList items={items} value={[]} onValueChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Who can apply?" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("FaqSection", () => {
  beforeEach(() => {
    stubMatchMedia({ reducedMotion: true });
    stubObservers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("opens the default answers under a bare title", async () => {
    const { container } = render(<FaqSection items={items} defaultValue={[items[0].question]} />);
    const section = screen.getByRole("region", {
      name: "Frequently asked questions",
    });
    // No eyebrow by default: the title opens the section.
    expect(section).toHaveTextContent(/^Frequently asked questions/);
    expect(screen.getByRole("button", { name: "Who can apply?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
