import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Display, Eyebrow, Heading, Highlight, Prose, Text } from "./typography";

describe("Display", () => {
  test("is an h2 at the large display step by default", () => {
    render(<Display>Build what comes next</Display>);
    const heading = screen.getByRole("heading", { level: 2, name: "Build what comes next" });
    expect(heading).toHaveClass("text-display-lg", "text-fg");
  });

  test("keeps the size independent of the outline level", () => {
    render(
      <Display as="h1" size="md">
        Page title
      </Display>,
    );
    const heading = screen.getByRole("heading", { level: 1, name: "Page title" });
    expect(heading).toHaveClass("text-display-md");
    expect(heading).not.toHaveClass("text-display-lg");
  });
});

describe("Heading", () => {
  test("is an h3 at the medium heading step by default", () => {
    render(<Heading>Card title</Heading>);
    expect(screen.getByRole("heading", { level: 3, name: "Card title" })).toHaveClass(
      "text-heading-md",
    );
  });

  test("renders the requested level and size", () => {
    render(
      <Heading as="h4" size="lg">
        Nested title
      </Heading>,
    );
    expect(screen.getByRole("heading", { level: 4, name: "Nested title" })).toHaveClass(
      "text-heading-lg",
    );
  });
});

describe("Text", () => {
  test("is muted body copy in a paragraph by default", () => {
    render(<Text>Running copy</Text>);
    const paragraph = screen.getByText("Running copy");
    expect(paragraph.tagName).toBe("P");
    expect(paragraph).toHaveClass("text-body", "text-fg-muted");
  });

  test.each([
    ["default", "text-fg"],
    ["muted", "text-fg-muted"],
    ["subtle", "text-fg-subtle"],
  ] as const)("emphasis %s sets the text color", (emphasis, color) => {
    render(<Text emphasis={emphasis}>Copy</Text>);
    expect(screen.getByText("Copy")).toHaveClass(color);
  });

  test("renders the requested element and size", () => {
    render(
      <Text as="span" size="meta" className="tabular">
        12 May
      </Text>,
    );
    const meta = screen.getByText("12 May");
    expect(meta.tagName).toBe("SPAN");
    expect(meta).toHaveClass("text-meta", "tabular");
  });
});

describe("Eyebrow", () => {
  test("renders only the label without an index", () => {
    const { container } = render(<Eyebrow>Primary logo</Eyebrow>);
    const eyebrow = container.firstElementChild;
    expect(eyebrow?.tagName).toBe("P");
    expect(eyebrow).toHaveTextContent(/^Primary logo$/);
    expect(eyebrow?.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  test("pads a numeric index, hides the rule and keeps the words apart", async () => {
    const { container } = render(<Eyebrow index={3}>Projects</Eyebrow>);
    const eyebrow = container.firstElementChild;
    // toHaveTextContent collapses whitespace, so the hidden separator reads as ", ".
    expect(eyebrow).toHaveTextContent(/^03, Projects$/);
    expect(eyebrow?.querySelector('[aria-hidden="true"]')).toBeEmptyDOMElement();
    expect(await axe(container)).toHaveNoViolations();
  });

  test("keeps a string index as given", () => {
    render(
      <Eyebrow as="span" index="IV">
        Chapter
      </Eyebrow>,
    );
    expect(screen.getByText("IV")).toBeInTheDocument();
    expect(screen.getByText("Chapter").parentElement?.tagName).toBe("SPAN");
  });

  test("still renders an index of 0", () => {
    render(<Eyebrow index={0}>Prologue</Eyebrow>);
    expect(screen.getByText("00")).toBeInTheDocument();
  });
});

describe("Highlight", () => {
  test("marks emphasis inside a headline with the accent color", async () => {
    const { container } = render(
      <Display as="h1">
        Build what comes <Highlight>next</Highlight>
      </Display>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Build what comes next" })).toBeVisible();
    expect(screen.getByText("next")).toHaveClass("text-highlight");
    expect(await axe(container)).toHaveNoViolations();
  });

  test("fade switches to the brand gradient", () => {
    render(<Highlight variant="fade">ahead</Highlight>);
    const highlight = screen.getByText("ahead");
    expect(highlight).toHaveClass("text-gradient-brand");
    expect(highlight).not.toHaveClass("text-highlight");
  });
});

describe("Prose", () => {
  test("styles long-form markup without changing its structure", async () => {
    const { container } = render(
      <Prose className="mt-8">
        <h2>Privacy</h2>
        <p>
          We store <strong>no</strong> tracking data. Read the <a href="#terms">terms</a>.
        </p>
        <ul>
          <li>Contact data</li>
        </ul>
      </Prose>,
    );
    const prose = container.firstElementChild;
    expect(prose).toHaveClass("prose", "max-w-none", "mt-8");
    expect(screen.getByRole("heading", { level: 2, name: "Privacy" })).toBeVisible();
    expect(screen.getByRole("link", { name: "terms" })).toHaveAttribute("href", "#terms");
    expect(screen.getByRole("listitem")).toHaveTextContent("Contact data");
    expect(await axe(container)).toHaveNoViolations();
  });
});
