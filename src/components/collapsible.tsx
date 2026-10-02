import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";

import { cn } from "../lib/cn";

/*
 * Disclosure on Base UI with a smooth height transition. No "use client":
 * the Base UI parts are client components already.
 */

/** Props for {@link Collapsible}: Base UI's root props. */
export type CollapsibleProps = Omit<BaseCollapsible.Root.Props, "className"> & {
  /** Classes for the root element. */
  className?: string;
};

/** Root of a disclosure: one trigger and one panel. */
export function Collapsible({ className, ...props }: CollapsibleProps) {
  return <BaseCollapsible.Root className={className} {...props} />;
}

/** Props for {@link CollapsibleTrigger}: Base UI's trigger props. */
export type CollapsibleTriggerProps = Omit<BaseCollapsible.Trigger.Props, "className"> & {
  /**
   * Classes merged over the defaults. The trigger is `group/collapsible`, so
   * children can style the open state with `group-data-[panel-open]/collapsible:`.
   */
  className?: string;
};

/** The button that opens and closes the panel (`aria-expanded` included). */
export function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return <BaseCollapsible.Trigger className={cn("group/collapsible", className)} {...props} />;
}

/** Props for {@link CollapsiblePanel}: Base UI's panel props. */
export type CollapsiblePanelProps = Omit<BaseCollapsible.Panel.Props, "className"> & {
  /** Classes merged over the defaults (height transition, clipping). */
  className?: string;
};

/** The disclosed content; its height eases (instant under reduced motion). */
export function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        "data-[ending-style]:h-0 data-[starting-style]:h-0 h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-surface ease-brand motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
