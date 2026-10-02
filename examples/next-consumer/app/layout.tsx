import "./globals.css";

import { Footer, Header, SkipLink } from "@tum-ai/ui-kit/shell";
const logo = { src: "/logo.svg", width: 112, height: 36, alt: "TUM.ai" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div id="app-root" data-tone="paper">
          <SkipLink />
          <Header
            logo={logo}
            navigation={[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
            ]}
            cta={{ href: "/about", label: "Learn more" }}
            solid
          />
          <div style={{ paddingTop: "var(--header-offset)" }}>{children}</div>
          <Footer
            logo={logo}
            tagline="Built from the packed library."
            columns={[
              {
                id: "explore",
                title: "Explore",
                links: [{ href: "/about", label: "About the kit" }],
              },
            ]}
            bottomLine="TUM.ai UI kit consumer"
          />
        </div>
      </body>
    </html>
  );
}
