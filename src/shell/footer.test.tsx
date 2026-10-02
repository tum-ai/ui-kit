import { axe } from "@test/axe";
import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ButtonLink } from "../components/button";
import { Footer } from "./footer";
import { shellColumns, shellLogo } from "./testing";

describe("Footer", () => {
  test("renders caller content synchronously on the server", () => {
    const result = Footer({
      logo: shellLogo,
      tagline: "Build what comes next.",
      columns: shellColumns,
      bottomLine: <p>Example organization</p>,
    });
    expect(result).not.toBeInstanceOf(Promise);
    const html = renderToStaticMarkup(result);
    expect(html).toContain("Build what comes next.");
    expect(html).toContain("Example organization");
    expect(html).toContain('data-tone="night"');
  });
  test("renders logo, action and bottom-line slots with native footer attributes", () => {
    render(
      <Footer
        logo={{
          src: "/assets/placeholder.svg",
          width: 480,
          height: 120,
          alt: "Example brand",
          unoptimized: true,
        }}
        tagline="A reusable footer."
        columns={shellColumns}
        actions={<ButtonLink href="/join">Join the project</ButtonLink>}
        bottomLine={
          <>
            <p>Example organization</p>
            <p>Somewhere useful</p>
          </>
        }
        className="custom-footer"
        aria-label="Application footer"
      />,
    );
    const footer = screen.getByRole("contentinfo", { name: "Application footer" });
    expect(footer).toHaveClass("custom-footer");
    expect(within(footer).getByRole("img", { name: "Example brand" })).toHaveAttribute(
      "src",
      "/assets/placeholder.svg",
    );
    expect(within(footer).getByRole("link", { name: "Join the project" })).toHaveAttribute(
      "href",
      "/join",
    );
    expect(within(footer).getByText("Example organization")).toBeVisible();
    expect(within(footer).getByText("Somewhere useful")).toBeVisible();
  });
  test("uses stable column IDs when titles are duplicated or translated", () => {
    const columns = [
      { id: "main", title: "Links", links: [{ href: "/one", label: "One" }] },
      { id: "secondary", title: "Links", links: [{ href: "/two", label: "Two" }] },
    ];
    const { rerender } = render(<Footer logo={shellLogo} tagline="Footer" columns={columns} />);
    expect(document.getElementById("footer-main")).toHaveTextContent("Links");
    expect(document.getElementById("footer-secondary")).toHaveTextContent("Links");
    expect(screen.getAllByRole("list", { name: "Links" })).toHaveLength(2);
    rerender(
      <Footer
        logo={shellLogo}
        tagline="Footer"
        columns={columns.map((column) => ({ ...column, title: "Verweise" }))}
      />,
    );
    expect(document.getElementById("footer-main")).toHaveTextContent("Verweise");
    expect(screen.getAllByRole("list", { name: "Verweise" })).toHaveLength(2);
  });
  test("preserves accessible external-link behavior", async () => {
    const { container } = render(
      <Footer logo={shellLogo} tagline="Footer" columns={shellColumns} />,
    );
    expect(
      screen.getByRole("link", { name: /^Community\s?\(opens in a new tab\)$/ }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Say hello" })).not.toHaveAttribute("target");
    expect(await axe(container)).toHaveNoViolations();
  });
});
