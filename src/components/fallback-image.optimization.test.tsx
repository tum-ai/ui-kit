import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { describe, expect, test, vi } from "vitest";

import { FallbackImage } from "./fallback-image";
import { IndexList } from "./index-list";
import { LogoTile } from "./logo-wall";
import { PersonCard } from "./person-card";
import { Photo } from "./photo";
import { QuoteCard } from "./quote-card";

// Assert the consumer-facing Next.js contract without requiring a host app's
// remotePatterns. Next.js itself is exercised by the original component suites.
vi.mock("next/image", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ src, alt, unoptimized, onError }: ImageProps) =>
      createElement("img", {
        src: typeof src === "string" ? src : "static-image",
        alt,
        onError,
        "data-unoptimized": String(unoptimized),
      }),
  };
});

const remote = "https://images.example.org/artwork.jpg";

describe("media optimization contract", () => {
  test.each(["http://images.example.org/artwork.jpg", remote])(
    "FallbackImage serves %s as is by default",
    (src) => {
      render(
        <FallbackImage src={src} alt="Artwork" width={100} height={100} fallback="Unavailable" />,
      );
      expect(screen.getByRole("img")).toHaveAttribute("data-unoptimized", "true");
    },
  );
  test("FallbackImage honors an explicit optimization request", () => {
    render(
      <FallbackImage
        src={remote}
        unoptimized={false}
        alt="Artwork"
        width={100}
        height={100}
        fallback="Unavailable"
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("data-unoptimized", "false");
  });
  test.each([undefined, false, true])("Photo and PersonCard honor override %s", (unoptimized) => {
    const { rerender } = render(<Photo src={remote} alt="Workshop" unoptimized={unoptimized} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-unoptimized",
      String(unoptimized ?? true),
    );
    rerender(<PersonCard name="Ada" image={{ src: remote }} unoptimized={unoptimized} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-unoptimized",
      String(unoptimized ?? true),
    );
  });
  test("local artwork retains optimization defaults and can bypass explicitly", () => {
    const { rerender } = render(<Photo src="/assets/placeholder.svg" alt="Workshop" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-unoptimized", "false");
    rerender(<Photo src="/assets/placeholder.svg" alt="Workshop" unoptimized />);
    expect(screen.getByRole("img")).toHaveAttribute("data-unoptimized", "true");
  });
  test.each([undefined, false, true])(
    "IndexList applies override %s to preview and thumbnail",
    (unoptimized) => {
      const { container } = render(
        <IndexList
          items={[
            {
              id: "one",
              title: "Research",
              description: "Explore",
              href: "/research",
              image: { src: remote, unoptimized },
            },
          ]}
        />,
      );
      const images = [...container.querySelectorAll("img")];
      expect(images).toHaveLength(2);
      for (const image of images)
        expect(image).toHaveAttribute("data-unoptimized", String(unoptimized ?? true));
    },
  );
  test("QuoteCard sets optimization separately for portrait and logo", () => {
    const { container } = render(
      <QuoteCard
        quote="Build together"
        name="Ada"
        portrait={{ src: remote, unoptimized: false }}
        logo={{ src: remote, alt: "Lab" }}
      />,
    );
    expect(container.querySelector('img[alt=""]')).toHaveAttribute("data-unoptimized", "false");
    expect(screen.getByRole("img", { name: "Lab" })).toHaveAttribute("data-unoptimized", "true");
  });
  test("LogoTile honors an explicit remote optimization override", () => {
    render(<LogoTile name="Lab" src={remote} unoptimized={false} />);
    expect(screen.getByRole("img")).toHaveAttribute("data-unoptimized", "false");
  });
});
