import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Container } from "./container";
import { FaqList, type FaqListProps } from "./faq-list";
import { Section } from "./section";

const items = [
  {
    id: "kit-faq-overview",
    question: "How does this list work?",
    answer:
      "Choose a question to read its answer. Opening another question closes the previous answer.",
  },
  {
    id: "kit-faq-link",
    question: "Can I link to an answer?",
    answer:
      "Yes. Give an item a stable id and link to that fragment. The matching answer opens and returns to view.",
  },
  {
    id: "kit-faq-content",
    question: "Can an answer contain more than a sentence?",
    answer: (
      <>
        <p>Answers can contain paragraphs, lists, and useful links.</p>
        <p className="mt-4">
          Keep the question concise and give the reader enough context to decide on a next step.
        </p>
      </>
    ),
  },
];
function ControlledFaq(args: FaqListProps) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <>
      <p className="mb-6 text-small text-fg-muted" aria-live="polite">
        {value.length ? `Open question: ${value[0]}` : "No question is open"}
      </p>
      <FaqList {...args} value={value} onValueChange={setValue} />
    </>
  );
}
const meta = {
  title: "Compositions/FaqList",
  component: FaqList,
  parameters: {
    layout: "fullscreen",
    kit: { exports: ["FaqList"], tones: ["paper", "mist", "lavender", "ink", "night", "violet"] },
  },
  args: { items },
  render: (args) => (
    <Section spacing="md">
      <Container size="narrow">
        <FaqList {...args} />
      </Container>
    </Section>
  ),
} satisfies Meta<typeof FaqList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: items[0].question });
    const second = canvas.getByRole("button", { name: items[1].question });
    await expect(first).toHaveAttribute("aria-expanded", "false");
    first.focus();
    await userEvent.keyboard("{Enter}");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(second);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard(" ");
    await expect(second).toHaveAttribute("aria-expanded", "false");
  },
};
export const OpenAnswer: Story = { args: { defaultValue: [items[0].question] } };
export const Controlled: Story = {
  render: (args) => (
    <Section spacing="md">
      <Container size="narrow">
        <ControlledFaq {...args} />
      </Container>
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: items[1].question }));
    await expect(canvas.getByText(`Open question: ${items[1].question}`)).toBeVisible();
  },
};
export const DeepLink: Story = {
  args: { defaultValue: [items[0].question] },
  render: (args) => (
    <Section spacing="md">
      <Container size="narrow">
        <p className="mb-6 text-small text-fg-muted">Use the link to open the matching question.</p>
        <a
          className="mb-8 inline-block text-highlight underline underline-offset-4"
          href="#kit-faq-link"
        >
          Jump to the linking answer
        </a>
        <FaqList {...args} />
      </Container>
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = window.location.href;
    const previousState = window.history.state;
    const linked = new URL(previous);
    linked.hash = items[1].id;
    await expect(canvas.getByRole("link", { name: "Jump to the linking answer" })).toHaveAttribute(
      "href",
      "#kit-faq-link",
    );
    try {
      // Exercise the component's fragment subscription without navigating
      // Vitest's tester document away from its browser connection.
      window.history.replaceState(previousState, "", linked.href);
      window.dispatchEvent(
        new HashChangeEvent("hashchange", { oldURL: previous, newURL: linked.href }),
      );
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: items[1].question })).toHaveAttribute(
          "aria-expanded",
          "true",
        ),
      );
      await expect(canvas.getByRole("button", { name: items[0].question })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    } finally {
      window.history.replaceState(previousState, "", previous);
    }
  },
};
export const LongAnswers: Story = {
  args: {
    defaultValue: [items[2].question],
    items: [
      ...items,
      {
        question: "How can a long question and a detailed answer work together on a narrow screen?",
        answer: (
          <>
            <p>
              Use a clear question even when it takes several lines. The trigger keeps the complete
              question readable and provides an accessible control for the answer.
            </p>
            <p className="mt-4">
              An answer may need several paragraphs to provide useful context. The panel expands
              naturally, leaving the following questions reachable by keyboard and easy to scan.
            </p>
          </>
        ),
      },
    ],
  },
};
export const FourthLevelHeadings: Story = { args: { headingAs: "h4" } };
