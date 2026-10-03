import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FaqSection } from "./faq-section";
import { TextLink } from "./text-link";

const meta = {
  title: "Compositions/FaqSection",
  component: FaqSection,
  parameters: {
    layout: "fullscreen",
    kit: {
      exports: ["FaqSection"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    id: "kit-faq-section",
    items: [
      {
        question: "Where should I begin?",
        answer: "Start with the question that best describes what you need to understand.",
      },
      {
        question: "What if I need more context?",
        answer:
          "The heading column can hold an introduction and a related link, while answers provide the details.",
      },
      {
        question: "How do I reach the next question?",
        answer: "Every question is a keyboard-accessible button. Use Tab to move through the list.",
      },
    ],
  },
} satisfies Meta<typeof FaqSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Frequently asked questions" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Where should I begin?" }));
    // The answer fades in with its height.
    await waitFor(() =>
      expect(
        canvas.getByText(
          "Start with the question that best describes what you need to understand.",
        ),
      ).toBeVisible(),
    );
  },
};
export const Lavender: Story = { args: { tone: "lavender" } };
export const WithIntroduction: Story = {
  args: {
    eyebrow: "Useful context",
    title: "A few common questions",
    lead: "The answers below give a little more detail before you take the next step.",
    aside: <TextLink href="#related">Explore a related example</TextLink>,
  },
};
export const OpenAnswer: Story = { args: { defaultValue: ["What if I need more context?"] } };
export const LongContent: Story = {
  args: {
    title: "Everything you need to know before taking the next step",
    lead: "A longer introduction can explain the purpose of the questions, point out which information is relevant to different readers, and help them choose where to begin.",
    items: [
      {
        question:
          "How should I read a question when it needs several lines to explain the complete situation?",
        answer: (
          <>
            <p>
              The full question remains part of the heading and the button. This keeps its meaning
              clear for every reader.
            </p>
            <p className="mt-4">
              Answers can expand to several paragraphs when that makes the information easier to
              understand.
            </p>
          </>
        ),
      },
      {
        question: "Can I return to the list after reading an answer?",
        answer: "Yes. Close the answer or move to the next question with the keyboard.",
      },
    ],
    defaultValue: [
      "How should I read a question when it needs several lines to explain the complete situation?",
    ],
  },
};
