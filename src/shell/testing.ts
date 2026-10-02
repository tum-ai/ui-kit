import type { FooterColumn } from "./footer";
import type { NavLink, ShellLogo } from "./types";

// Local, synthetic content shared only by shell stories and tests.
export const shellLogo: ShellLogo = {
  src: "/assets/tum_ai_logo_new.svg",
  width: 1640,
  height: 406,
  alt: "TUM.ai",
};
export const shellNavigation: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/updates", label: "Updates" },
];
export const shellConnectLinks: readonly NavLink[] = [
  { href: "https://example.com/community", label: "Community" },
  { href: "mailto:hello@example.com", label: "Say hello" },
];
export const shellColumns: readonly FooterColumn[] = [
  { id: "explore", title: "Explore", links: shellNavigation },
  { id: "connect", title: "Connect", links: shellConnectLinks },
  { id: "legal", title: "Legal", links: [{ href: "/privacy", label: "Privacy" }] },
  {
    id: "contribute",
    title: "Contribute",
    links: [{ href: "/contribute", label: "Get involved" }],
  },
];
