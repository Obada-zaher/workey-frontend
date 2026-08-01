import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; fullWidth?: boolean; }

export function Button({ children, className, disabled, fullWidth = false, loading = false, size = "medium", variant = "primary", ...props }: ButtonProps) {
  const classes = `ui-button ui-button--${variant}${size === "medium" ? "" : ` ui-button--${size}`}${fullWidth ? " ui-button--full" : ""}${className ? ` ${className}` : ""}`;
  return <button aria-busy={loading || undefined} className={classes} disabled={disabled || loading} {...props}>{loading ? <span aria-hidden="true">Loading…</span> : children}</button>;
}
