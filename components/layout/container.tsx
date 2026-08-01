import type { HTMLAttributes, ReactNode } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> { children: ReactNode; fullWidth?: boolean; }

export function Container({ children, className, fullWidth = false, ...props }: ContainerProps) {
  return <div className={`layout-container${fullWidth ? " layout-container--full" : ""}${className ? ` ${className}` : ""}`} {...props}>{children}</div>;
}
