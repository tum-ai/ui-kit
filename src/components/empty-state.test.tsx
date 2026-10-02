import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "lucide-react";
import { describe, expect, test, vi } from "vitest";

import { axe } from "../../test/axe";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  test("announces an empty result with guidance and an accessible recovery action", async () => {
    const clear = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <EmptyState
        icon={Search}
        title="No results"
        action={
          <button type="button" onClick={clear}>
            Clear filters
          </button>
        }
      >
        Try another query.
      </EmptyState>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No results");
    expect(screen.getByRole("status")).toHaveTextContent("Try another query.");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(clear).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });
  test("supports a plain status without optional content", () => {
    render(<EmptyState title="Nothing here yet" />);
    expect(screen.getByRole("status")).toHaveTextContent("Nothing here yet");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
