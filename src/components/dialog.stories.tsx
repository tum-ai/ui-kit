import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Actions } from "./actions";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function Example(args: DialogContentProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open event details</DialogTrigger>
      <DialogContent {...args}>
        <div className="space-y-5 p-7 sm:p-10">
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>
            Learn what the session covers and choose your next step.
          </DialogDescription>
          {args.children}
          <Actions>
            <Button>Register interest</Button>
            <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
          </Actions>
        </div>
      </DialogContent>
    </Dialog>
  );
}
const meta = {
  title: "Interactions/Dialog",
  component: DialogContent,
  parameters: {
    kit: {
      exports: [
        "Dialog",
        "DialogTrigger",
        "DialogClose",
        "DialogContent",
        "DialogTitle",
        "DialogDescription",
      ],
      tones: ["paper", "mist", "lavender", "ink", "night", "violet"],
    },
  },
  args: {
    variant: "modal",
    size: "lg",
    tone: "paper",
    children: (
      <p className="text-body text-fg-muted">
        A focused session about research, collaboration, and building useful prototypes.
      </p>
    ),
  },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof DialogContent>;
export default meta;
type Story = StoryObj<typeof meta>;
const openEventDialog: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "Open event details" }));
  const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog", {
    name: "Event details",
  });
  await waitFor(() => expect(dialog).toBeVisible());
};
export const Modal: Story = {
  play: async (context) => {
    await openEventDialog(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const dialog = body.getByRole("dialog", { name: "Event details" });
    await expect(dialog).toHaveAccessibleDescription(
      "Learn what the session covers and choose your next step.",
    );
    await expect(context.canvasElement.ownerDocument.getElementById("app-root")?.inert).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(body.queryByRole("dialog", { name: "Event details" })).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        within(context.canvasElement).getByRole("button", { name: "Open event details" }),
      ).toHaveFocus(),
    );
  },
};
export const Medium: Story = { args: { size: "md" }, play: openEventDialog };
export const Large: Story = { args: { size: "lg" }, play: openEventDialog };
export const ExtraLarge: Story = { args: { size: "xl" }, play: openEventDialog };
export const Fullscreen: Story = {
  args: { variant: "fullscreen", className: "max-w-xl" },
  play: openEventDialog,
};
export const InkSurface: Story = { args: { tone: "ink" }, play: openEventDialog };
export const WithoutCornerClose: Story = { args: { showClose: false }, play: openEventDialog };
export const LongContent: Story = {
  args: {
    size: "md",
    children: (
      <div className="space-y-5 text-body text-fg-muted">
        {Array.from({ length: 8 }, (_, index) => (
          <p key={index}>
            Part {index + 1}: the session follows a clear question from its first assumptions
            through a small experiment and a review of the results. Keep the decisions
            understandable, invite useful feedback, and document what the team can try next.
          </p>
        ))}
      </div>
    ),
  },
  play: openEventDialog,
};
export const DisabledTrigger: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />} disabled>
        Event details unavailable
      </DialogTrigger>
      <DialogContent>
        <div className="p-8">
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>This trigger is disabled.</DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
export const CustomBackgroundRoot: Story = {
  render: (args) => (
    <div id="dialog-story-background">
      <p className="mb-4 text-body text-fg-muted">
        The consumer supplies a different background root ID.
      </p>
      <Dialog backgroundRootId="dialog-story-background">
        <DialogTrigger render={<Button variant="outline" />}>Open event details</DialogTrigger>
        <DialogContent {...args}>
          <div className="space-y-5 p-8">
            <DialogTitle>Event details</DialogTitle>
            <DialogDescription>
              A custom root is isolated until this dialog closes.
            </DialogDescription>
            <DialogClose render={<Button />}>Done</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async (context) => {
    await openEventDialog(context);
    await expect(
      context.canvasElement.ownerDocument.getElementById("dialog-story-background")?.inert,
    ).toBe(true);
  },
};
function ControlledExample(args: DialogContentProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Open event details</DialogTrigger>
      <DialogContent {...args}>
        <div className="space-y-5 p-8">
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>The consumer controls the open state.</DialogDescription>
          <DialogClose render={<Button />}>Done</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  play: openEventDialog,
};
export const Nested: Story = {
  render: (args) => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open event details</DialogTrigger>
      <DialogContent {...args}>
        <div className="space-y-5 p-8">
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>
            The outer modal remains open while the next step is confirmed.
          </DialogDescription>
          <Dialog>
            <DialogTrigger render={<Button />}>Review registration</DialogTrigger>
            <DialogContent size="md">
              <div className="space-y-5 p-8">
                <DialogTitle>Confirm registration</DialogTitle>
                <DialogDescription>
                  Closing this step returns to the event details.
                </DialogDescription>
                <DialogClose render={<Button />}>Return to details</DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  ),
  play: async (context) => {
    await openEventDialog(context);
    const body = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: "Review registration" }));
    const nestedDialog = await body.findByRole("dialog", { name: "Confirm registration" });
    await waitFor(() => expect(nestedDialog).toBeVisible());
    await userEvent.click(body.getByRole("button", { name: "Return to details" }));
    await waitFor(() =>
      expect(body.queryByRole("dialog", { name: "Confirm registration" })).not.toBeInTheDocument(),
    );
    await expect(context.canvasElement.ownerDocument.getElementById("app-root")?.inert).toBe(true);
    await waitFor(() => expect(body.getByRole("dialog", { name: "Event details" })).toBeVisible());
    await waitFor(() =>
      expect(body.getByRole("button", { name: "Review registration" })).toHaveFocus(),
    );
  },
};
