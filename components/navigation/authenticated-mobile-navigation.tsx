"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";

const links = [
  { href: routes.authenticatedHome, label: "Home", matches: (pathname: string) => pathname === routes.authenticatedHome },
  { href: routes.explore, label: "Explore", matches: (pathname: string) => pathname.startsWith(routes.explore) || pathname.startsWith("/jobs/") },
  { href: routes.applications, label: "Applications", matches: (pathname: string) => pathname.startsWith(routes.applications) },
  { href: routes.profile, label: "Profile", matches: (pathname: string) => pathname.startsWith(routes.profile) },
];

export function AuthenticatedMobileNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Authenticated navigation" className="account-bottom-nav">
      {links.map((link) => {
        const active = link.matches(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`account-bottom-nav__link${active ? " account-bottom-nav__link--active" : ""}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
