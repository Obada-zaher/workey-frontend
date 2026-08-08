"use client";

/* eslint-disable @next/next/no-img-element -- Company-cover hosts are supplied dynamically by the API. */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CompanyIdentity } from "@/components/jobs/company-identity";
import type { FeaturedCompany } from "@/lib/api/types";

export function CompanyCard({ company, variant = "default" }: { company: FeaturedCompany; variant?: "default" | "mini" }) {
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const coverUrl = company.cover_image_url ?? null;
  const hasCover = Boolean(coverUrl && failedCoverUrl !== coverUrl);
  return <article className={`company-card ui-card h-full${variant === "mini" ? " company-card--mini" : ""} ${hasCover ? "company-card--has-cover" : "company-card--no-cover"}`}>{hasCover && coverUrl ? <div aria-hidden="true" className="company-card__cover"><img alt="" loading="lazy" onError={() => setFailedCoverUrl(coverUrl)} src={coverUrl} /></div> : null}<div className="company-card__logo"><CompanyIdentity context={hasCover ? "media" : "default"} logoUrl={company.logo_url} name={company.name} size={variant === "mini" ? "medium" : "large"} /></div><div className="company-card__content"><h3 className="type-heading-3 text-text-primary">{company.name}</h3>{company.industry ? <p className="type-body-small text-text-secondary">{company.industry}</p> : null}{company.location && variant === "default" ? <p className="type-body-small text-text-muted">{company.location}</p> : null}<Badge variant="neutral">{company.open_jobs_count} open {company.open_jobs_count === 1 ? "job" : "jobs"}</Badge></div></article>;
}
