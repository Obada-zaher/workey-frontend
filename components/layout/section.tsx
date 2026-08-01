import type { HTMLAttributes, ReactNode } from "react";
import { Container } from "./container";

type SectionSpacing = "compact" | "standard" | "spacious";
type SectionSurface = "default" | "muted" | "surface";
interface SectionProps extends HTMLAttributes<HTMLElement> { children: ReactNode; spacing?: SectionSpacing; surface?: SectionSurface; contained?: boolean; }

export function Section({ children, className, spacing = "standard", surface = "default", contained = true, ...props }: SectionProps) {
  const surfaceClass = surface === "default" ? "" : ` layout-section--${surface}`;
  const spacingClass = spacing === "standard" ? "" : ` layout-section--${spacing}`;
  return <section className={`layout-section${spacingClass}${surfaceClass}${className ? ` ${className}` : ""}`} {...props}>{contained ? <Container>{children}</Container> : children}</section>;
}
