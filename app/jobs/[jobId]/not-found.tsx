import Link from "next/link";
import { Container } from "@/components/layout/container";
import { AuthenticatedHeader } from "@/components/navigation/authenticated-header";
import { AuthenticatedMobileNavigation } from "@/components/navigation/authenticated-mobile-navigation";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getCurrentUser } from "@/lib/auth/server";
import { routes } from "@/config/routes";

export default async function JobNotFound() {
  const user = await getCurrentUser();
  return <div className={user ? "account-app-shell min-h-dvh bg-background" : "min-h-dvh bg-background"}>{user ? <AuthenticatedHeader user={user} /> : <PublicHeader />}<main className={user ? "account-main" : "layout-section"}><Container><section className="job-detail__state ui-card ui-card--muted"><h1>This opportunity could not be found.</h1><p>It may have been removed or is no longer available.</p><Link className="ui-button ui-button--primary" href={routes.explore}>Explore other opportunities</Link></section></Container></main>{user ? <AuthenticatedMobileNavigation /> : <PublicFooter />}</div>;
}
