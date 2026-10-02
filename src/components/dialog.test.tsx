import { axe } from "@test/axe";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { stubMatchMedia, stubObservers } from "./testing";

function Page({
  variant,
  ...dialogProps
}: Pick<DialogProps, "modal" | "onOpenChange"> & { variant?: "modal" | "fullscreen" }) {
  return (
    <div id="app-root">
      <a href="#behind">Link behind the dialog</a>
      <Dialog {...dialogProps}>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent variant={variant}>
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>Where and when.</DialogDescription>
          <button type="button">Register</button>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}

beforeEach(() => {
  stubMatchMedia();
  stubObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openDialog() {
  const user = userEvent.setup();
  render(<Page />);
  const trigger = screen.getByRole("button", { name: "Open details" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Event details" });
  return { user, trigger, dialog };
}

describe("Dialog", () => {
  test("opens a named, described modal dialog", async () => {
    const { dialog } = await openDialog();
    expect(dialog).toHaveAccessibleDescription("Where and when.");
  });

  test("makes the page behind it inert while open", async () => {
    const { user } = await openDialog();
    const root = document.getElementById("app-root");
    expect(root?.inert).toBe(true);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(root?.inert).toBe(false));
  });

  test("traps focus inside the dialog", async () => {
    const { user, dialog } = await openDialog();
    const focusIsInside = () =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await waitFor(focusIsInside);
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      await waitFor(focusIsInside);
    }
    for (let step = 0; step < 3; step += 1) {
      await user.tab({ shift: true });
      await waitFor(focusIsInside);
    }
  });

  test("closes on Escape and returns focus to the trigger", async () => {
    const { user, trigger } = await openDialog();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  test("has a labelled close button", async () => {
    const { user } = await openDialog();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("fullscreen variant has no corner close button by default", async () => {
    const user = userEvent.setup();
    render(<Page variant="fullscreen" />);
    await user.click(screen.getByRole("button", { name: "Open details" }));
    await screen.findByRole("dialog", { name: "Event details" });
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  test("a canceled uncontrolled open leaves the background interactive", async () => {
    const user = userEvent.setup();
    let cancelOpen = true;
    const onOpenChange = vi.fn<NonNullable<DialogProps["onOpenChange"]>>((next, details) => {
      if (next && cancelOpen) details.cancel();
    });
    render(<Page onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open details" });
    const root = document.getElementById("app-root");

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(root?.inert).not.toBe(true);

    cancelOpen = false;
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Event details" });
    expect(root?.inert).toBe(true);
  });

  test("a canceled uncontrolled close keeps the open modal background inert", async () => {
    const user = userEvent.setup();
    let cancelClose = true;
    const onOpenChange = vi.fn<NonNullable<DialogProps["onOpenChange"]>>((next, details) => {
      if (!next && cancelClose) details.cancel();
    });
    render(<Page onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Open details" }));
    const dialog = await screen.findByRole("dialog", { name: "Event details" });
    const root = document.getElementById("app-root");

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ isCanceled: true }),
    );
    expect(dialog).toBeInTheDocument();
    expect(root?.inert).toBe(true);

    cancelClose = false;
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(root?.inert).toBe(false);
  });

  test.each([false, "trap-focus"] as const)(
    "modal=%s permits background interaction while open",
    async (modal) => {
      const user = userEvent.setup();
      render(<Page modal={modal} />);
      await user.click(screen.getByRole("button", { name: "Open details" }));
      await screen.findByRole("dialog", { name: "Event details" });
      const root = document.getElementById("app-root");
      expect(root?.inert).not.toBe(true);
      await user.click(screen.getByRole("button", { name: "Done" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(root?.inert).not.toBe(true);
    },
  );

  test("has no axe violations while open", async () => {
    const { dialog } = await openDialog();
    expect(await axe(dialog)).toHaveNoViolations();
  });
});

function ControlledDialog({
  children,
  ...props
}: Omit<DialogProps, "children"> & { children?: ReactNode }) {
  return (
    <Dialog {...props}>
      <DialogContent showClose={false}>
        <DialogTitle>Controlled dialog</DialogTitle>
        <DialogDescription>Background isolation example.</DialogDescription>
        <DialogClose>Dismiss controlled dialog</DialogClose>
        {children}
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog background portability", () => {
  test("tracks separate consumer roots independently", () => {
    function IndependentRoots({ firstOpen }: { firstOpen: boolean }) {
      return (
        <>
          <div id="first-root">First page</div>
          <div id="second-root">Second page</div>
          <ControlledDialog open={firstOpen} backgroundRootId="first-root" />
          <ControlledDialog open backgroundRootId="second-root" />
        </>
      );
    }
    const { rerender, unmount } = render(<IndependentRoots firstOpen />);
    const first = document.getElementById("first-root");
    const second = document.getElementById("second-root");
    expect(first?.inert).toBe(true);
    expect(second?.inert).toBe(true);

    rerender(<IndependentRoots firstOpen={false} />);
    expect(first?.inert).toBe(false);
    expect(second?.inert).toBe(true);
    unmount();
    expect(second?.inert).toBe(false);
  });

  test("restores a pre-existing inert state after close and unmount", () => {
    const background = document.createElement("div");
    background.id = "already-inert";
    background.inert = true;
    document.body.append(background);
    try {
      const { rerender, unmount } = render(
        <ControlledDialog open backgroundRootId="already-inert" />,
      );
      expect(background.inert).toBe(true);
      rerender(<ControlledDialog open={false} backgroundRootId="already-inert" />);
      expect(background.inert).toBe(true);
      rerender(<ControlledDialog open backgroundRootId="already-inert" />);
      unmount();
      expect(background.inert).toBe(true);
    } finally {
      background.remove();
    }
  });

  test("preserves inert HTML attributes when the property is absent in jsdom", () => {
    const background = document.createElement("div");
    background.id = "inert-attribute";
    background.setAttribute("inert", "");
    document.body.append(background);
    try {
      const { unmount } = render(<ControlledDialog open backgroundRootId="inert-attribute" />);
      unmount();
      expect(background.inert).toBe(true);
      expect(background).toHaveAttribute("inert");
    } finally {
      background.remove();
    }
  });

  test("keeps a shared root inert until the last nested modal closes", () => {
    function Nested({ innerOpen, outerOpen }: { innerOpen: boolean; outerOpen: boolean }) {
      return (
        <>
          <div id="nested-root">Page behind both dialogs</div>
          <ControlledDialog open={outerOpen} backgroundRootId="nested-root">
            <ControlledDialog open={innerOpen} backgroundRootId="nested-root" />
          </ControlledDialog>
        </>
      );
    }
    const { rerender } = render(<Nested outerOpen innerOpen />);
    const background = document.getElementById("nested-root");
    expect(background?.inert).toBe(true);
    rerender(<Nested outerOpen innerOpen={false} />);
    expect(background?.inert).toBe(true);
    rerender(<Nested outerOpen={false} innerOpen={false} />);
    expect(background?.inert).toBe(false);
  });

  test("releases all nested owners when their tree unmounts", () => {
    const background = document.createElement("div");
    background.id = "unmount-root";
    document.body.append(background);
    try {
      const { unmount } = render(
        <ControlledDialog open backgroundRootId="unmount-root">
          <ControlledDialog open backgroundRootId="unmount-root" />
        </ControlledDialog>,
      );
      expect(background.inert).toBe(true);
      unmount();
      expect(background.inert).toBe(false);
    } finally {
      background.remove();
    }
  });

  test("moves isolation to a replacement background root", () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.id = "old-root";
    second.id = "new-root";
    document.body.append(first, second);
    try {
      const { rerender, unmount } = render(<ControlledDialog open backgroundRootId="old-root" />);
      rerender(<ControlledDialog open backgroundRootId="new-root" />);
      expect(first.inert).toBe(false);
      expect(second.inert).toBe(true);
      unmount();
      expect(second.inert).toBe(false);
    } finally {
      first.remove();
      second.remove();
    }
  });

  test("updates isolation when an open dialog changes its modality", () => {
    const background = document.createElement("div");
    background.id = "changing-modal-root";
    document.body.append(background);
    try {
      const { rerender, unmount } = render(
        <ControlledDialog open backgroundRootId="changing-modal-root" />,
      );
      expect(background.inert).toBe(true);
      rerender(<ControlledDialog open modal="trap-focus" backgroundRootId="changing-modal-root" />);
      expect(background.inert).toBe(false);
      rerender(<ControlledDialog open modal={false} backgroundRootId="changing-modal-root" />);
      expect(background.inert).toBe(false);
      rerender(<ControlledDialog open modal backgroundRootId="changing-modal-root" />);
      expect(background.inert).toBe(true);
      unmount();
      expect(background.inert).toBe(false);
    } finally {
      background.remove();
    }
  });

  test("still opens when the optional background element is missing", () => {
    render(<ControlledDialog open backgroundRootId="missing-consumer-root" />);
    expect(screen.getByRole("dialog", { name: "Controlled dialog" })).toBeInTheDocument();
  });
});
