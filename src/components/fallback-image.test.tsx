import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { axe } from "../../test/axe";
import { FallbackImage } from "./fallback-image";

describe("FallbackImage", () => {
  test.each([undefined, ""])("shows accessible fallback content when source is %s", async (src) => {
    const { container } = render(
      <FallbackImage
        src={src}
        alt="Workshop"
        width={100}
        height={100}
        fallback={<p>Workshop image unavailable</p>}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Workshop image unavailable")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  test("reports an error before replacing the failed image", () => {
    const onError = vi.fn(() =>
      expect(screen.getByRole("img", { name: "Workshop" })).toBeInTheDocument(),
    );
    render(
      <FallbackImage
        src="/assets/placeholder.svg"
        alt="Workshop"
        width={100}
        height={100}
        fallback={<p>Unavailable</p>}
        onError={onError}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Workshop" }));
    expect(onError).toHaveBeenCalledOnce();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeVisible();
  });
  test("tries a changed source without inheriting the old failure", () => {
    const { rerender } = render(
      <FallbackImage
        src="/assets/placeholder.svg"
        alt="Artwork"
        width={100}
        height={100}
        fallback={<p>Unavailable</p>}
      />,
    );
    fireEvent.error(screen.getByRole("img"));
    rerender(
      <FallbackImage
        src="/assets/tum_ai_logo_new.svg"
        alt="Artwork"
        width={100}
        height={100}
        fallback={<p>Unavailable</p>}
      />,
    );
    expect(screen.getByRole("img", { name: "Artwork" })).toHaveAttribute(
      "src",
      expect.stringContaining("/assets/tum_ai_logo_new.svg"),
    );
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });
});
