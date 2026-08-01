"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserAvatar } from "@/components/account/user-avatar";
import { routes } from "@/config/routes";
import type { AuthenticatedUser } from "@/lib/auth/types";

export function AccountMenu({ user }: { user: AuthenticatedUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const roleLabel = user.role.value || "Job seeker";

  useEffect(() => {
    if (!isOpen) return;

    function closeWhenLeaving(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeWhenLeaving);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenLeaving);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Open account menu for ${user.name}`}
        className="account-menu__trigger"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <UserAvatar name={user.name} size="small" />
        <span className="account-menu__trigger-copy">
          <span>{user.name}</span>
          <small>{roleLabel}</small>
        </span>
        <svg aria-hidden="true" className="account-menu__chevron" fill="none" viewBox="0 0 16 16">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      </button>
      <div aria-hidden={!isOpen} aria-label="Account menu" className="account-menu__panel" data-open={isOpen} id={menuId} role="menu">
        <div className="account-menu__identity">
          <UserAvatar name={user.name} size="small" />
          <span><strong>{user.name}</strong><small>{roleLabel}</small></span>
        </div>
        <div className="account-menu__actions">
          <Link href={routes.profile} onClick={() => setIsOpen(false)} role="menuitem">Profile</Link>
          <LogoutButton compact />
        </div>
      </div>
    </div>
  );
}
