import Link from "next/link";

interface LogoProps { href?: string | null; size?: "small" | "medium" | "large"; }

export function Logo({ href = "/", size = "medium" }: LogoProps) {
  const sizeClass = size === "small" ? "type-heading-4" : size === "large" ? "type-heading-1" : "type-heading-2";
  const className = `${sizeClass} font-bold text-text-primary no-underline`;
  return href ? <Link aria-label="Workey home" className={className} href={href}>Workey</Link> : <span className={className}>Workey</span>;
}
