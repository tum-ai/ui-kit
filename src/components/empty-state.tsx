import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { IconBadge } from "./icon-badge";

/** Props for {@link EmptyState}. */
export type EmptyStateProps = {
  /** Icon above the title. */
  icon?: LucideIcon;
  /** What is empty, e.g. "No events found". */
  title: ReactNode;
  /** What to do about it. */
  children?: ReactNode;
  /** A button that resolves it (e.g. "Clear filters"). */
  action?: ReactNode;
  /** Classes merged over the dashed panel. */
  className?: string;
};

/**
 * Friendly placeholder for empty lists and filter results. It is a status
 * region, so a filter that empties a list is announced.
 */
export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-3xl px-6 py-16 flex flex-col items-center border border-dashed border-hairline-strong text-center",
        className,
      )}
    >
      {icon ? <IconBadge icon={icon} variant="soft" size="lg" shape="circle" /> : null}
      <p className="mt-5 text-heading-md text-fg">{title}</p>
      {children ? <div className="mt-2 max-w-md text-small text-fg-muted">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
