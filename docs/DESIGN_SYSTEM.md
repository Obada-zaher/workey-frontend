# Workey Job-Seeker Design System

This design system serves Workey's public job-seeker web application, alongside the job-seeker mobile application. The Mobile App Postman collection is the primary backend contract; `backend-reference` is read-only. Employer dashboard and platform-admin interfaces are out of scope.

Future work supports Arabic RTL and English LTR, uses centralized tokens, implements one feature at a time, and never invents endpoints or response fields.

## Architecture

`styles/tokens.css` is the visual source of truth. It contains semantic CSS custom properties for color, typography, spacing, layout, shape, elevation, motion, and optional glass effects. `app/globals.css` imports those tokens, supplies global base styles, maps common values into Tailwind 4 utilities, and supplies the token-backed styles consumed by the shared layout and UI primitives.

`config/design-system.ts` deliberately contains only strongly typed application metadata: theme options, locale directions, breakpoints, component sizes, and the documentation path. It must not duplicate raw visual values from CSS.

## Customization

Change token values in `styles/tokens.css`:

- Brand: update `--color-primary` and its state/foreground companions.
- Background and surfaces: update the `--color-background` and `--color-surface-*` families.
- Typography: update the font-family, font-size, weight, line-height, and letter-spacing token groups. The existing Next.js optimized Geist fonts remain the English defaults; `--font-family-arabic` is ready for a future Arabic font decision.
- Spacing and page padding: update `--space-*`, then `--layout-page-padding-*` and `--layout-section-gap` where needed.
- Portal dimensions: update the `--layout-*` tokens, including future sidebar and header dimensions.
- Shape, elevation, and motion: update their respective `--radius-*`, `--shadow-*`, `--duration-*`, and `--easing-*` groups.
- Glass: tune the `--glass-*` group. `.surface-glass` has a solid surface fallback and only enables blur where the browser supports it.

## Themes

Workey uses a restrained indigo-blue identity, with calm blue-gray support and a subtle teal accent. Light mode pairs a cool neutral background with near-white surfaces, subtle cool-gray borders, and restrained elevation. Dark mode uses layered blue-charcoal surfaces rather than inversion or pure black.

`styles/tokens.css` is the sole palette source. `:root` defines light tokens; `:root:not([data-theme])` inside the system-dark media query defines system dark tokens; `data-theme="light"` and `data-theme="dark"` explicitly override the system. The valid values are `light`, `dark`, and `system`.

The preference is stored under `workey-theme`. A small pre-hydration script applies a saved explicit preference to `<html>` before page content renders, preventing an incorrect-theme flash. `ThemeToggle` switches between explicit light and dark; `system` remains supported internally by removing `data-theme` and following the operating system.

English uses optimized Geist through `--font-english`; Arabic uses optimized Tajawal through `--font-tajawal` and `--font-family-arabic`. Future localization only needs to set `lang="ar"` and `dir="rtl"` on the document: the global selectors apply Tajawal and Arabic-friendly line height automatically.

## Mobile Alignment

The web and mobile projects do not share code automatically. They can share a documented design language by mapping equivalent semantic concepts and values: Primary, Background, Surface, Text primary, Text secondary, Border, Success, Warning, Danger, spacing scale, radius scale, and typography scale.

## Usage Rules

Future components must use semantic tokens or the mapped Tailwind utilities, reuse the spacing scale, and avoid repeated arbitrary visual values. Preserve accessible contrast, apply glass only to sparse decorative surfaces (never dense tables or long forms), and keep dark mode and future RTL support in mind.

## Verification Preview

`/design-system` is a small development preview for checking tokens. It is intentionally simple and can be removed or access-restricted before a public production release.
