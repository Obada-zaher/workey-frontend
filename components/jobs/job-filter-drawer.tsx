"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface JobFilterDrawerProps {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
}

const focusable = "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

export function JobFilterDrawer({ children, onClose, open }: JobFilterDrawerProps) {
  const panel = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timer = window.setTimeout(() => panel.current?.querySelector<HTMLElement>(focusable)?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const elements = [...panel.current.querySelectorAll<HTMLElement>(focusable)];
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="explore-filter-drawer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section aria-label="Filters" aria-modal="true" className="explore-filter-drawer__panel" ref={panel} role="dialog">
        {children}
      </section>
    </div>
  );
}
