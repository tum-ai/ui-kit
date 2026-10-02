import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "./accordion";
import { BulletList } from "./bullet-list";

const meta = {
  title: "Interactions/Accordion",
  component: Accordion,
  parameters: {
    kit: {
      exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionPanel"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="join">
        <AccordionTrigger headingAs="h2">How can I get involved?</AccordionTrigger>
        <AccordionPanel>
          Start with a team, meet the people building it, and choose a project that interests you.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="experience">
        <AccordionTrigger headingAs="h2">Do I need previous experience?</AccordionTrigger>
        <AccordionPanel>
          Bring curiosity and a willingness to learn. Teams combine several areas of expertise.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "How can I get involved?" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    const nextTrigger = canvas.getByRole("button", { name: "Do I need previous experience?" });
    await expect(nextTrigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(nextTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
export const InitiallyOpen: Story = { args: { defaultValue: ["join"] } };
export const MultipleOpen: Story = {
  args: { multiple: true, defaultValue: ["join", "experience"] },
};
export const Disabled: Story = { args: { disabled: true } };
export const LongContent: Story = {
  args: { defaultValue: ["long"] },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="long">
        <AccordionTrigger headingAs="h2">
          What does collaboration look like across a complete project?
        </AccordionTrigger>
        <AccordionPanel>
          <p className="mb-4">
            A project grows through research, design, implementation, and feedback. The answer stays
            in the document even while closed so visitors can find it with their browser.
          </p>
          <BulletList
            items={[
              "Explore the question and agree on what a useful result looks like.",
              "Build a small version together and review the decisions behind it.",
              "Share the result, collect feedback, and document what the team learned.",
            ]}
          />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};
