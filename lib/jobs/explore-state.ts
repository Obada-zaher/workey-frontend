export const authenticatedExploreTabs = ["for-you", "latest", "all"] as const;
export const guestExploreTabs = ["latest", "all"] as const;
export type ExploreTab = (typeof authenticatedExploreTabs)[number];

export function defaultExploreTab(authenticated: boolean): ExploreTab {
  return authenticated ? "for-you" : "latest";
}

export function normalizeExploreTab(value: string | null | undefined, authenticated: boolean): ExploreTab {
  if (authenticated && authenticatedExploreTabs.includes(value as ExploreTab)) return value as ExploreTab;
  if (!authenticated && guestExploreTabs.includes(value as (typeof guestExploreTabs)[number])) return value as ExploreTab;
  return defaultExploreTab(authenticated);
}
