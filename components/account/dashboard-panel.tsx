import type { HTMLAttributes, ReactNode } from "react";

export function DashboardPanel({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <article className={`dashboard-panel${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </article>
  );
}
