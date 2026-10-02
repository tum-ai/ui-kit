import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import type { HeadingLevel } from "./types";

/*
 * Accordion on Base UI, which handles keyboard, ARIA and focus. Panels stay
 * in the DOM as `hidden="until-found"`, so find-in-page and crawlers still
 * reach the answers. No "use client" here: the Base UI parts are client
 * components already, so server pages can render an accordion directly.
 * FaqList (./faq-list) composes these parts into a deep-linkable list.
 */

/** Props for {@link Accordion}: Base UI's root props. */
export type AccordionProps = Omit<BaseAccordion.Root.Props, "className"> & {
  /** Classes merged over the defaults (a hairline above the first item). */
  className?: string;
};

/** List of disclosure items; one open at a time unless `multiple`. */
export function Accordion({ className, ...props }: AccordionProps) {
  return <BaseAccordion.Root className={cn("border-t border-hairline", className)} {...props} />;
}

/** Props for {@link AccordionItem}: Base UI's item props. */
export type AccordionItemProps = Omit<BaseAccordion.Item.Props, "className"> & {
  /** Classes merged over the defaults (a hairline below the item). */
  className?: string;
};

/** One question and answer. Give it a stable `value` to control it. */
export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return <BaseAccordion.Item className={cn("border-b border-hairline", className)} {...props} />;
}

/** Props for {@link AccordionTrigger}. */
export type AccordionTriggerProps = Omit<BaseAccordion.Trigger.Props, "className" | "children"> & {
  /** The question. */
  children: ReactNode;
  /** Heading level that wraps the trigger. Default `h3`. */
  headingAs?: HeadingLevel;
  /** Classes merged over the trigger button's defaults. */
  className?: string;
};

/**
 * The question row: a heading wrapping a full-width button, with a plus that
 * turns into a filled minus while the panel is open.
 */
export function AccordionTrigger({
  children,
  headingAs: HeadingTag = "h3",
  className,
  ...props
}: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header render={<HeadingTag />} className="m-0">
      <BaseAccordion.Trigger
        className={cn(
          "group/trigger gap-6 py-6 md:py-7 flex w-full items-center justify-between text-left text-heading-md text-fg transition-colors duration-hover ease-brand hover:text-highlight",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <span
          aria-hidden
          className="size-10 relative grid shrink-0 place-items-center rounded-full border border-hairline-strong text-fg transition-[background-color,border-color,color,rotate,scale] duration-surface ease-brand group-hover/trigger:border-fg/50 group-data-[panel-open]/trigger:border-transparent group-data-[panel-open]/trigger:bg-fg group-data-[panel-open]/trigger:text-canvas motion-safe:group-active/trigger:scale-90 motion-safe:group-data-[panel-open]/trigger:rotate-180 motion-reduce:transition-none"
        >
          <span className="w-3.5 absolute h-[1.5px] rounded-full bg-current" />
          <span className="h-3.5 absolute w-[1.5px] rounded-full bg-current transition-transform duration-surface ease-brand group-data-[panel-open]/trigger:scale-y-0 motion-reduce:transition-none" />
        </span>
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

/** Props for {@link AccordionPanel}. */
export type AccordionPanelProps = Omit<
  BaseAccordion.Panel.Props,
  "className" | "children" | "hiddenUntilFound"
> & {
  /** The answer. */
  children: ReactNode;
  /**
   * Classes for the answer's content box. The panel element itself only
   * animates its height, so padding and type go here.
   */
  className?: string;
};

/** The answer; its height eases open and closed (instant under reduced motion). */
export function AccordionPanel({ children, className, ...props }: AccordionPanelProps) {
  return (
    <BaseAccordion.Panel
      hiddenUntilFound
      className="group/panel data-[ending-style]:h-0 data-[starting-style]:h-0 h-(--accordion-panel-height) overflow-hidden transition-[height] duration-surface ease-brand motion-reduce:transition-none"
      {...props}
    >
      <div
        className={cn(
          "max-w-3xl pb-7 md:pr-14 [&_a]:font-semibold text-body text-fg-muted [&_a]:text-highlight [&_a]:underline [&_a]:underline-offset-4",
          // The answer fades in with the height and out a little faster.
          "transition-opacity duration-surface ease-brand group-data-[ending-style]/panel:opacity-0 group-data-[ending-style]/panel:duration-hover group-data-[starting-style]/panel:opacity-0 motion-reduce:transition-none",
          className,
        )}
      >
        {children}
      </div>
    </BaseAccordion.Panel>
  );
}
