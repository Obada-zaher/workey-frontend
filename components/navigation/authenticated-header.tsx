"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/account/account-menu";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { routes } from "@/config/routes";
import type { AuthenticatedUser } from "@/lib/auth/types";

const links = [
  { href: routes.authenticatedHome, label: "Home", matches: (pathname: string) => pathname === routes.authenticatedHome },
  { href: routes.explore, label: "Explore", matches: (pathname: string) => pathname.startsWith(routes.explore) || pathname.startsWith("/jobs/") },
  { href: routes.profile, label: "Profile", matches: (pathname: string) => pathname.startsWith(routes.profile) },
];

export function AuthenticatedHeader({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header className={`account-header${isScrolled ? " account-header--scrolled" : ""}`}>
      <Container className="account-header__inner">
        <div className="account-header__brand"><Logo href={routes.authenticatedHome} size="small" /></div>
        <nav aria-label="Authenticated navigation" className="account-header__nav">
          {links.map((link) => {
            const active = link.matches(pathname);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`account-header__nav-link${active ? " account-header__nav-link--active" : ""}`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="account-header__actions">
          <div className="account-header__theme-control"><ThemeToggle /></div>
          <AccountMenu user={user} />
        </div>
      </Container>
    </header>
  );
}
