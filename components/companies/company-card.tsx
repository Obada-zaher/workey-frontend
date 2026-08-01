import { Badge } from "@/components/ui/badge";
import type { FeaturedCompany } from "@/lib/api/types";

export function CompanyCard({
  company,
  variant = "default",
}: {
  company: FeaturedCompany;
  variant?: "default" | "mini";
}) {
  const initials = company.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className={`company-card ui-card h-full${variant === "mini" ? " company-card--mini" : ""}`}
    >
      <div
        aria-label={`${company.name} initials`}
        className="radius-medium flex size-12 items-center justify-center bg-accent font-semibold text-accent-foreground"
      >
        {initials}
      </div>
      <h3 className="type-heading-3 mt-5 text-text-primary">{company.name}</h3>
      {company.industry ? (
        <p className="type-body-small mt-2 text-text-secondary">{company.industry}</p>
      ) : null}
      {company.location && variant === "default" ? (
        <p className="type-body-small mt-2 text-text-muted">{company.location}</p>
      ) : null}
      <div className="mt-5">
        <Badge variant="neutral">
          {company.open_jobs_count} open {company.open_jobs_count === 1 ? "job" : "jobs"}
        </Badge>
      </div>
    </article>
  );
}
