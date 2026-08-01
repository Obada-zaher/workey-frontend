"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { routes } from "@/config/routes";

interface NavigationLink { href: string; label: string; }

export function MobileNavigation({ links }: { links: NavigationLink[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const firstLink = useRef<HTMLAnchorElement | null>(null);
  const panel = useRef<HTMLElement | null>(null);
  const closeMenu = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  return <div className="mobile-navigation md:hidden"><button aria-controls="mobile-menu" aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"} className="theme-toggle" onClick={() => open ? closeMenu() : setOpen(true)} ref={trigger} type="button">{open ? "×" : "☰"}</button>{open ? <div className="mobile-menu-backdrop" onClick={closeMenu} role="presentation"><nav aria-label="Mobile navigation" className="mobile-menu-panel ui-card ui-card--elevated" id="mobile-menu" onClick={(event) => event.stopPropagation()} ref={panel}>{links.map((link, index) => <Link className="public-nav-link mobile-menu-link" href={link.href} key={link.href} onClick={closeMenu} ref={index === 0 ? firstLink : undefined}>{link.label}</Link>)}<div className="mt-3 flex flex-wrap items-center gap-3"><ThemeToggle /><Link className="ui-button ui-button--outline ui-button--small" href={routes.login} onClick={closeMenu}>Sign in</Link><Link className="ui-button ui-button--primary ui-button--small" href={routes.register} onClick={closeMenu}>Create account</Link></div></nav></div> : null}</div>;
}
