"use client";

import { useEffect, useSyncExternalStore } from "react";
import { themeStorageKey, themes, type Theme } from "@/config/design-system";

const themeChangeEvent = "workey-theme-change";
function isTheme(value: string | null): value is Theme { return value !== null && (themes as readonly string[]).includes(value); }
function getStoredTheme(): Theme { try { const value = localStorage.getItem(themeStorageKey); return isTheme(value) ? value : "system"; } catch { return "system"; } }
function subscribeTheme(onStoreChange: () => void) { window.addEventListener("storage", onStoreChange); window.addEventListener(themeChangeEvent, onStoreChange); return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener(themeChangeEvent, onStoreChange); }; }
function subscribeSystemTheme(onStoreChange: () => void) { const media = window.matchMedia("(prefers-color-scheme: dark)"); media.addEventListener("change", onStoreChange); return () => media.removeEventListener("change", onStoreChange); }
function getSystemTheme() { return window.matchMedia("(prefers-color-scheme: dark)").matches; }
function applyTheme(theme: Theme) { if (theme === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme; }

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, getStoredTheme, (): Theme => "system");
  const systemDark = useSyncExternalStore(subscribeSystemTheme, getSystemTheme, () => false);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} mode`;

  function changeTheme() {
    try { localStorage.setItem(themeStorageKey, nextTheme); } catch { /* Storage may be unavailable. */ }
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return <button aria-label={label} aria-pressed={resolvedTheme === "dark"} className="theme-toggle" onClick={changeTheme} title={label} type="button">{resolvedTheme === "dark" ? <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="currentColor" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28l1.42 1.42m10.6 10.6 1.42 1.42m0-13.44-1.42 1.42m-10.6 10.6-1.42 1.42" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg> : <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M20.4 15.45A8.65 8.65 0 0 1 8.55 3.6 8.7 8.7 0 1 0 20.4 15.45Z" /></svg>}</button>;
}
