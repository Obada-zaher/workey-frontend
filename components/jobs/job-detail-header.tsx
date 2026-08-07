"use client";

/* eslint-disable @next/next/no-img-element -- Company-cover hosts are supplied dynamically by the API. */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CompanyIdentity } from "@/components/jobs/company-identity";
import type { Job } from "@/lib/api/types";

function label(value: unknown): string | null { return value && typeof value === "object" && "value" in value && typeof value.value === "string" && value.value.trim() ? value.value : null; }
function formatDate(value: unknown): string | null { return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : null; }

export function JobDetailHeader({ job }: { job: Job }) {
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const company = job.company?.name?.trim() || "Company";
  const coverUrl = job.company?.cover_image_url ?? null;
  const hasCover = Boolean(coverUrl && failedCoverUrl !== coverUrl);
  const workMode = label(job.work_mode); const employmentType = label(job.employment_type); const experience = label(job.experience_level); const published = formatDate(job.published_at); const deadline = formatDate(job.application_deadline);
  return <header className={`job-detail__header ${hasCover ? "job-detail__header--has-cover" : "job-detail__header--no-cover"}`}>{hasCover && coverUrl ? <><div aria-hidden="true" className="job-detail__cover"><img alt="" loading="eager" onError={() => setFailedCoverUrl(coverUrl)} src={coverUrl} /></div><div aria-hidden="true" className="job-detail__scrim" /></> : null}<div className="job-detail__identity"><CompanyIdentity logoUrl={job.company?.logo_url} name={company} size="hero" /><div><p className="job-detail__company">{company}</p><h1>{job.title}</h1></div></div><div className="job-detail__header-meta">{job.location ? <span>{job.location}</span> : null}{workMode ? <Badge variant="primary">{workMode}</Badge> : null}{employmentType ? <Badge>{employmentType}</Badge> : null}{experience ? <Badge>{experience}</Badge> : null}</div>{published || deadline ? <p className="job-detail__published">{published ? `Published ${published}` : null}{published && deadline ? " · " : null}{deadline ? `Deadline ${deadline}` : null}</p> : null}</header>;
}
