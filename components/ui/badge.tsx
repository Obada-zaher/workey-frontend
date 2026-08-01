import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "information";
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { children: ReactNode; variant?: BadgeVariant; }

export function Badge({ children, className, variant = "neutral", ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge--${variant}${className ? ` ${className}` : ""}`} {...props}>{children}</span>;
}
