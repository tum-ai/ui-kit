import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { axe } from "../../test/axe";
import { LogoTile, LogoWall } from "./logo-wall";

describe("LogoTile", () => {
  test("shows the artwork named by the organization", () => {
    render(<LogoTile name="NVIDIA" src="/assets/tum_ai_logo_new.svg" />);
    expect(screen.getByRole("img", { name: "NVIDIA" })).toBeInTheDocument();
  });

  test("falls back to the name when the artwork fails to load", () => {
    render(<LogoTile name="Helmholtz" src="/missing.png" />);
    fireEvent.error(screen.getByRole("img", { name: "Helmholtz" }));
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Helmholtz")).toBeInTheDocument();
  });

  test("sets the name beside a symbol in a wordmark lockup", () => {
    const { container } = render(
      <LogoTile
        name="Y Combinator"
        src="/assets/tum_ai_logo_new.svg"
        wordmark="Y Combinator"
        variant="chip"
      />,
    );
    expect(screen.getByText("Y Combinator")).toBeInTheDocument();
    // The symbol is decorative next to the name.
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  test("links out in a new tab and says so", () => {
    render(<LogoTile name="Google" href="https://google.com" />);
    const link = screen.getByRole("link", {
      name: /^Google\s?\(opens in a new tab\)$/,
    });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("links to routes in the same tab", () => {
    render(<LogoTile name="Partners" href="/partners" />);
    expect(screen.getByRole("link", { name: "Partners" })).not.toHaveAttribute("target");
  });

  test("sets artwork for dark bands without a white surface", () => {
    render(
      <LogoTile
        variant="bare"
        name="NVIDIA"
        src="/assets/tum_ai_logo_new.svg"
        href="https://nvidia.com"
      />,
    );
    const link = screen.getByRole("link", {
      name: /^NVIDIA\s?\(opens in a new tab\)$/,
    });
    expect(link).not.toHaveClass("bg-white");
    expect(screen.getByRole("img", { name: "NVIDIA" })).not.toHaveClass("mix-blend-multiply");
  });

  test("keeps a mono tile free of opacity, so its artwork's multiply blend reaches the band", () => {
    const { container } = render(
      <LogoTile variant="mono" name="Google" src="/assets/tum_ai_logo_new.svg" />,
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).not.toMatch(/\bopacity-/);
    expect(screen.getByRole("img", { name: "Google" })).toHaveClass(
      "mix-blend-multiply",
      "opacity-75",
    );
  });

  test("reserves a fixed width for chips in wrapping rows", () => {
    const { container } = render(
      <LogoTile variant="chip" fixed name="Google" src="/missing.png" />,
    );
    expect(container.firstElementChild).toHaveClass("w-25");
  });

  test("steps a large tile down one size below md when responsive", () => {
    const { container } = render(<LogoTile size="xl" responsive name="Lab" />);
    expect(container.firstElementChild).toHaveClass("h-32", "max-md:h-28");
  });

  test("serves every remote host as is by default", () => {
    const src = "https://images.example.org/lab.png";
    render(<LogoTile name="Lab" src={src} />);
    expect(screen.getByRole("img", { name: "Lab" })).toHaveAttribute("src", src);
  });

  test("serves artwork from other hosts as is", () => {
    const src = "https://example.org/lab.png";
    render(<LogoTile name="Lab" src={src} />);
    expect(screen.getByRole("img", { name: "Lab" })).toHaveAttribute("src", src);
  });
});

describe("LogoWall", () => {
  test("renders a named list of tiles without axe violations", async () => {
    const { container } = render(
      <LogoWall
        label="Collaborators"
        logos={[
          { name: "NVIDIA", src: "/assets/tum_ai_logo_new.svg" },
          { name: "Helmholtz Munich", href: "https://helmholtz-munich.de" },
        ]}
      />,
    );
    expect(screen.getByRole("list", { name: "Collaborators" }).children).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("a strip gives every logo the same area, whatever its shape", async () => {
    const { container } = render(
      <LogoWall
        layout="strip"
        label="Research partners"
        logos={[
          {
            name: "Wide",
            src: "/wide.png",
            aspectRatio: 4,
            href: "https://a.org",
          },
          { name: "Square", src: "/square.png", aspectRatio: 1 },
          { name: "Thin", src: "/thin.png", aspectRatio: 20 },
          { name: "Unknown", src: "/unknown.png" },
        ]}
      />,
    );
    const boxes = [...screen.getByRole("list", { name: "Research partners" }).children].map(
      (item) => {
        const style = (item as HTMLElement).style;
        return [
          Number.parseFloat(style.getPropertyValue("--logo-w")),
          Number.parseFloat(style.getPropertyValue("--logo-h")),
        ] as const;
      },
    );
    const [wide, square, thin, unknown] = boxes;
    expect(wide?.[0]).toBeCloseTo((wide?.[1] ?? 0) * 4, 2);
    // Equal area: width × height is the same for every known ratio.
    expect((wide?.[0] ?? 0) * (wide?.[1] ?? 0)).toBeCloseTo(
      (square?.[0] ?? 0) * (square?.[1] ?? 0),
      2,
    );
    // Extreme ratios are clamped instead of shrinking to a hairline.
    expect((thin?.[0] ?? 0) / (thin?.[1] ?? 1)).toBeCloseTo(6, 2);
    expect(unknown).toEqual([7, 2.5]);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("strip logos link out and keep their names", () => {
    render(
      <LogoWall
        layout="strip"
        logos={[{ name: "MIT", src: "/mit.png", href: "https://mit.edu" }]}
      />,
    );
    expect(
      screen.getByRole("link", { name: /^MIT\s?\(opens in a new tab\)$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "MIT" })).toBeInTheDocument();
  });
});
