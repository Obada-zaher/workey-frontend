import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "muted" | "elevated" | "interactive" | "glass";
interface CardProps extends HTMLAttributes<HTMLDivElement> { children: ReactNode; variant?: CardVariant; }

export function Card({ children, className, variant = "default", ...props }: CardProps) {
  return <div className={`ui-card${variant === "default" ? "" : ` ui-card--${variant}`}${className ? ` ${className}` : ""}`} {...props}>{children}</div>;
}
