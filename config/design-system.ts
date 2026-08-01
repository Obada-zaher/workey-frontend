export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];
export const themeStorageKey = "workey-theme" as const;

export const localeDirections = {
  en: "ltr",
  ar: "rtl",
} as const;
export type SupportedLocale = keyof typeof localeDirections;

export const breakpoints = {
  mobile: "0px",
  tablet: "48rem",
  desktop: "64rem",
} as const;

export const componentSizes = ["small", "medium", "large"] as const;
export type ComponentSize = (typeof componentSizes)[number];

export const designSystemDocumentation = "docs/DESIGN_SYSTEM.md" as const;
