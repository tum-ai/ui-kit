import { axe } from "@test/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "./accordion";

function Example({ disabled = false }: { disabled?: boolean }) {
  return (
    <Accordion disabled={disabled}>
      <AccordionItem value="first">
        <AccordionTrigger headingAs="h2">First question</AccordionTrigger>
        <AccordionPanel>First answer stays discoverable.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="second">
        <AccordionTrigger headingAs="h2">Second question</AccordionTrigger>
        <AccordionPanel>Second answer.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  test("keeps closed answers in the DOM for find in page", () => {
    render(<Example />);
    expect(screen.getByText("First answer stays discoverable.").parentElement).toHaveAttribute(
      "hidden",
      "until-found",
    );
    expect(screen.getByRole("heading", { level: 2, name: "First question" })).toBeInTheDocument();
  });

  test("opens from the keyboard and moves focus between questions", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    const first = screen.getByRole("button", { name: "First question" });
    await user.keyboard("{Enter}");
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    const second = screen.getByRole("button", { name: "Second question" });
    expect(second).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  test("disabled questions cannot open", async () => {
    const user = userEvent.setup();
    render(<Example disabled />);
    const first = screen.getByRole("button", { name: "First question" });
    expect(first).toHaveAttribute("aria-disabled", "true");
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  test("has no axe violations after opening", async () => {
    const user = userEvent.setup();
    const { container } = render(<Example />);
    await user.click(screen.getByRole("button", { name: "First question" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
