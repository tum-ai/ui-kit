import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Search, X } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Actions } from "./actions";
import { Button, ButtonLink, buttonStyles, IconButton } from "./button";

const meta = {
  title: "Actions/Button",
  component: Button,
  parameters: {
    kit: {
      exports: ["Button", "ButtonLink", "IconButton", "buttonStyles"],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: { children: "Get involved", onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Get involved" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Inverse: Story = { args: { variant: "inverse" }, globals: { tone: "ink" } };
export const Link: Story = { args: { variant: "link", children: "Read the introduction" } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Get involved" });
    await expect(button).toBeDisabled();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
export const FocusableDisabled: Story = {
  args: { disabled: true, focusableWhenDisabled: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "Get involved" }),
    ).toHaveAttribute("aria-disabled", "true");
  },
};
export const ArrowDirections: Story = {
  render: () => (
    <Actions>
      <ButtonLink href="#next" arrow>
        Continue
      </ButtonLink>
      <ButtonLink href="https://example.com" variant="outline" arrow="external">
        Project website
      </ButtonLink>
      <ButtonLink href="#details" variant="secondary" arrow="down">
        Read below
      </ButtonLink>
    </Actions>
  ),
};
export const IconControls: Story = {
  render: () => (
    <Actions>
      <IconButton aria-label="Search">
        <Search aria-hidden />
      </IconButton>
      <IconButton aria-label="Close" size="icon-sm" variant="outline">
        <X aria-hidden />
      </IconButton>
      <IconButton aria-label="Next" disabled>
        <ArrowRight aria-hidden />
      </IconButton>
    </Actions>
  ),
};
export const LongLabels: Story = {
  render: () => (
    <Actions>
      <ButtonLink href="#programme">Explore the full programme</ButtonLink>
      <Button variant="outline">Save this project for later</Button>
    </Actions>
  ),
};
export const CustomStyledElement: Story = {
  render: () => (
    <a href="#custom" className={buttonStyles({ variant: "outline", size: "md" })}>
      Custom accessible link
    </a>
  ),
};
