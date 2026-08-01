import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { routes } from "@/config/routes";
import { MobileNavigation } from "./mobile-navigation";

const links = [{ href: routes.publicHome, label: "Home" }, { href: routes.explore, label: "Explore" }, { href: "/#companies", label: "Companies" }, { href: "/#faq", label: "Career resources" }];
export function PublicHeader() { return <header className="public-header"><Container className="flex min-h-16 items-center justify-between gap-4"><Logo /><nav aria-label="Primary navigation" className="hidden items-center gap-6 md:flex">{links.map((link) => <Link className="public-nav-link" href={link.href} key={link.href}>{link.label}</Link>)}</nav><div className="hidden items-center gap-3 md:flex"><ThemeToggle /><Link className="ui-button ui-button--ghost ui-button--small" href={routes.login}>Sign in</Link><Link className="ui-button ui-button--primary ui-button--small" href={routes.register}>Create account</Link></div><div className="flex items-center gap-2 md:hidden"><ThemeToggle /><MobileNavigation links={links} /></div></Container></header>; }
