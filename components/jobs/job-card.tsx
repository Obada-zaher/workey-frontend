"use client";

/* eslint-disable @next/next/no-img-element -- Company-cover hosts are supplied dynamically by the API. */

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CompanyIdentity } from "@/components/jobs/company-identity";
import type { HomeJob, Job, JobRecommendation, Skill } from "@/lib/api/types";

type JobCardVariant = "default" | "compact" | "explore";
type RecommendationDetails = Pick<JobRecommendation, "score" | "matched_skills" | "missing_required_skills" | "reasons">;
function isDetailedJob(job: HomeJob | Job): job is Job { return "skills" in job; }
function validDate(value: unknown): string | null { return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null; }
function formatDate(value: unknown): string | null { const date = validDate(value); return date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : null; }
function localizedLabel(value: unknown): string | null { return value && typeof value === "object" && "value" in value && typeof value.value === "string" && value.value.trim() ? value.value : null; }
function safeSkills(value: unknown): Skill[] { return Array.isArray(value) ? value.filter((skill): skill is Skill => Boolean(skill) && typeof skill === "object" && typeof (skill as Skill).name === "string") : []; }
function percentage(value: unknown): number | null { if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null; return Math.round(Math.min(100, Math.max(0, value <= 1 ? value * 100 : value))); }

export function JobCard({ job, recommendation, variant = "default" }: { job: HomeJob | Job; recommendation?: RecommendationDetails; variant?: JobCardVariant }) {
  const detailed = isDetailedJob(job);
  const companyName = typeof job.company?.name === "string" && job.company.name.trim() ? job.company.name : "Company";
  const logoUrl = job.company?.logo_url ?? null;
  const coverUrl = job.company?.cover_image_url ?? null;
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const workMode = localizedLabel(job.work_mode); const employmentType = localizedLabel(job.employment_type); const experience = detailed ? localizedLabel(job.experience_level) : null;
  const publishedAt = validDate(job.published_at); const published = formatDate(job.published_at); const deadlineAt = detailed ? validDate(job.application_deadline) : null; const deadline = detailed ? formatDate(job.application_deadline) : null;
  const skills = detailed ? safeSkills(job.skills).slice(0, 3) : [];
  const matchedSkills = recommendation ? safeSkills(recommendation.matched_skills).slice(0, 3) : [];
  const score = recommendation ? percentage(recommendation.score) : null;
  const reason = recommendation && Array.isArray(recommendation.reasons) ? recommendation.reasons.find((item) => typeof item === "string" && item.trim()) : null;
  const detailHref = `/jobs/${job.id}`;
  const hasCover = Boolean(coverUrl && failedCoverUrl !== coverUrl);

  return <article className={`job-card ui-card ui-card--interactive job-card--${variant} ${hasCover ? "job-card--has-cover" : "job-card--no-cover"}`}>
    {hasCover && coverUrl ? <div aria-hidden="true" className="job-card__media"><img alt="" loading="lazy" onError={() => setFailedCoverUrl(coverUrl)} src={coverUrl} /><span className="job-card__media-logo"><CompanyIdentity context="media" logoUrl={logoUrl} name={companyName} size={variant === "explore" ? "medium" : "card"} /></span></div> : null}
    <div className="job-card__foreground">
      <header className="job-card__identity">{!hasCover ? <CompanyIdentity logoUrl={logoUrl} name={companyName} size={variant === "explore" ? "medium" : "card"} /> : null}<div className="job-card__title-group"><p className="job-card__company">{companyName}</p><h3 className="job-card__title"><Link aria-label={`View ${job.title} at ${companyName}`} href={detailHref}>{job.title}</Link></h3></div>{score !== null ? <Badge variant="primary">{score}% Match</Badge> : null}</header>
      <div className="job-card__content"><div className="job-card__meta">{job.location ? <span>{job.location}</span> : null}{workMode ? <Badge variant="primary">{workMode}</Badge> : null}{employmentType ? <Badge>{employmentType}</Badge> : null}{experience ? <Badge>{experience}</Badge> : null}</div>{skills.length || matchedSkills.length ? <div className="job-card__skills">{(matchedSkills.length ? matchedSkills : skills).map((skill) => <Badge key={skill.id}>{skill.name}</Badge>)}</div> : null}{reason ? <p className="job-card__reason">{reason}</p> : null}</div>
      <footer className="job-card__footer"><div className="job-card__dates">{published && publishedAt ? <time dateTime={publishedAt}>Published {published}</time> : null}{deadline && deadlineAt ? <time className={detailed && job.is_application_deadline_passed ? "job-card__deadline job-card__deadline--passed" : "job-card__deadline"} dateTime={deadlineAt}>{detailed && job.is_application_deadline_passed ? `Deadline passed ${deadline}` : `Deadline ${deadline}`}</time> : null}</div><Link className="job-card__action" href={detailHref}>View opportunity <span aria-hidden="true">→</span></Link></footer>
    </div>
  </article>;
}
