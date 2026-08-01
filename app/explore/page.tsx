import type { Metadata } from "next";
import { AuthenticatedHeader } from "@/components/navigation/authenticated-header";
import { AuthenticatedMobileNavigation } from "@/components/navigation/authenticated-mobile-navigation";
import { JobsExplorer } from "@/components/jobs/jobs-explorer";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Explore | Workey",
  description: "Search current opportunities on Workey.",
};

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const authenticated = Boolean(user);

  return (
    <div className={authenticated ? "account-app-shell min-h-dvh bg-background" : undefined}>
      <a className="skip-link" href="#explore-results">Skip to opportunities</a>
      {user ? <AuthenticatedHeader user={user} /> : <PublicHeader />}
      <main className={authenticated ? "account-main" : undefined} id="main-content">
        <Section spacing="compact" surface="muted">
          <SectionHeading
            description="Search current opportunities by keyword, location, or confirmed work mode."
            eyebrow="OPPORTUNITY EXPLORER"
            title="Explore opportunities"
          />
          <JobsExplorer />
        </Section>
      </main>
      {user ? <AuthenticatedMobileNavigation /> : <PublicFooter />}
    </div>
  );
}
