import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  test("targets main-content and uses the default label", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
  test("accepts a caller target, label and anchor attributes", () => {
    render(
      <SkipLink
        targetId="article"
        label="Jump to article"
        className="custom-skip"
        aria-describedby="skip-help"
      />,
    );
    const link = screen.getByRole("link", { name: "Jump to article" });
    expect(link).toHaveAttribute("href", "#article");
    expect(link).toHaveClass("custom-skip");
    expect(link).toHaveAttribute("aria-describedby", "skip-help");
  });
  test("is the first keyboard destination and has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <SkipLink />
        <a href="#later">Later link</a>
        <main id="main-content" tabIndex={-1}>
          <h1>Content</h1>
        </main>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });
});
