import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppFeaturesSection } from "@/components/home/app-features-section";
import { AccountBenefitsSection } from "@/components/home/account-benefits-section";
import { CompaniesSection } from "@/components/home/companies-section";
import { DiscoverySection } from "@/components/home/discovery-section";
import { EarlyCareerSection } from "@/components/home/early-career-section";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { HomeJobDiscovery } from "@/components/home/home-job-discovery";
import { SmartCvSection } from "@/components/home/smart-cv-section";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getGuestHome } from "@/lib/api/home";
import { getPublicJobs } from "@/lib/api/jobs";
import { getCurrentUser } from "@/lib/auth/server";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Workey | Discover your next opportunity", description: "Discover current opportunities, build your professional profile, and follow your recruitment journey with Workey.", openGraph: { title: "Workey | Discover your next opportunity", description: "A clearer public starting point for job seekers." } };

export default async function HomePage() {
  if (await getCurrentUser()) redirect(routes.authenticatedHome);
  const [homeResult, internshipResult] = await Promise.allSettled([getGuestHome(), getPublicJobs({ employment_type: "internship", accepting_applications: true, per_page: 3 })]);
  const home = homeResult.status === "fulfilled" ? homeResult.value : null;
  const internships = internshipResult.status === "fulfilled" ? internshipResult.value.data : [];
  return <><a className="skip-link" href="#main-content">Skip to main content</a><PublicHeader /><main id="main-content"><HomeJobDiscovery hero={home?.hero} heroJobs={home?.latest_jobs ?? []} /><DiscoverySection /><EarlyCareerSection jobs={internships} /><CompaniesSection companies={home?.featured_companies ?? []} /><AppFeaturesSection features={home?.app_features ?? []} /><HowItWorksSection /><AccountBenefitsSection /><SmartCvSection /><FaqSection /><FinalCtaSection /></main><PublicFooter /></>;
}
