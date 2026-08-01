import { routes } from "@/config/routes";

export function safeReturnTo(value: string | null | undefined, fallback = routes.authenticatedHome) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  try { return new URL(value, "https://workey.local").origin === "https://workey.local" ? value : fallback; } catch { return fallback; }
}
