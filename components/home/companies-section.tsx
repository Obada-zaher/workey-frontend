import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { CompanyCard } from "@/components/companies/company-card";
import type { FeaturedCompany } from "@/lib/api/types";

export function CompaniesSection({ companies }: { companies: FeaturedCompany[] }) { if (!companies.length) return null; return <Section id="companies"><SectionHeading eyebrow="COMPANIES HIRING NOW" title="Meet the teams behind the roles" description="Approved companies with open opportunities, directly from Workey." /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{companies.map((company) => <CompanyCard company={company} key={company.id} />)}</div></Section>; }
