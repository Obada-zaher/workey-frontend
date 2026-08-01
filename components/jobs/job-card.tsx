import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompanyIdentity } from "@/components/jobs/company-identity";
import type { HomeJob, Job, JobRecommendation, Skill } from "@/lib/api/types";

type JobCardVariant = "default" | "compact" | "explore";
type RecommendationDetails = Pick<JobRecommendation, "score" | "matched_skills" | "missing_required_skills" | "reasons">;

function isDetailedJob(job: HomeJob | Job): job is Job {
  return "skills" in job;
}

function validDate(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function formatDate(value: unknown): string | null {
  const date = validDate(value);
  return date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : null;
}

function localizedLabel(value: unknown): string | null {
  return value && typeof value === "object" && "value" in value && typeof value.value === "string" && value.value.trim() ? value.value : null;
}

function safeSkills(value: unknown): Skill[] {
  return Array.isArray(value) ? value.filter((skill): skill is Skill => Boolean(skill) && typeof skill === "object" && typeof (skill as Skill).name === "string") : [];
}

function formatSalary(value: unknown): string | null {
  const numeric = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(numeric) : null;
}

function salaryLabel(job: Job): string | null {
  const minimum = formatSalary(job.salary_min);
  const maximum = formatSalary(job.salary_max);
  if (minimum && maximum) return `Salary range: ${minimum}–${maximum}`;
  if (minimum) return `Salary from ${minimum}`;
  if (maximum) return `Salary up to ${maximum}`;
  return null;
}

function percentage(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  const normalized = value <= 1 ? value * 100 : value;
  return Math.round(Math.min(100, Math.max(0, normalized)));
}

function RecommendationSummary({ recommendation }: { recommendation: RecommendationDetails }) {
  const score = percentage(recommendation.score);
  const matched = safeSkills(recommendation.matched_skills).slice(0, 3);
  const missing = safeSkills(recommendation.missing_required_skills).slice(0, 2);
  const reason = Array.isArray(recommendation.reasons) ? recommendation.reasons.find((value) => typeof value === "string" && value.trim()) : null;
  if (score === null && !matched.length && !missing.length && !reason) return null;

  return (
    <div className="job-card__recommendation">
      {score !== null ? <div className="job-card__match"><span>Match: {score}%</span><span aria-label={`Match score ${score}%`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={score} className="job-card__match-bar" role="progressbar"><span style={{ width: `${score}%` }} /></span></div> : null}
      {matched.length ? <p><strong>Matches:</strong> {matched.map((skill) => skill.name).join(" · ")}</p> : null}
      {missing.length ? <p><strong>Develop:</strong> {missing.map((skill) => skill.name).join(" · ")}</p> : null}
      {reason ? <p className="job-card__reason">{reason}</p> : null}
    </div>
  );
}

export function JobCard({ job, recommendation, variant = "default" }: { job: HomeJob | Job; recommendation?: RecommendationDetails; variant?: JobCardVariant }) {
  const detailed = isDetailedJob(job);
  const companyName = typeof job.company?.name === "string" && job.company.name.trim() ? job.company.name : "Company";
  const logoUrl = job.company && "logo_url" in job.company && typeof job.company.logo_url === "string" ? job.company.logo_url : null;
  const workMode = localizedLabel(job.work_mode);
  const employmentType = localizedLabel(job.employment_type);
  const experience = detailed ? localizedLabel(job.experience_level) : null;
  const publishedAt = validDate(job.published_at);
  const published = formatDate(job.published_at);
  const deadlineAt = detailed ? validDate(job.application_deadline) : null;
  const deadline = detailed ? formatDate(job.application_deadline) : null;
  const skills = detailed ? safeSkills(job.skills).slice(0, 3) : [];
  const salary = detailed ? salaryLabel(job) : null;
  const detailHref = `/jobs/${job.id}`;

  return (
    <article className={`job-card ui-card ui-card--interactive job-card--${variant}`}>
      <div className="job-card__identity">
        <CompanyIdentity logoUrl={logoUrl} name={companyName} />
        <div className="job-card__title-group">
          <p className="job-card__company">{companyName}</p>
          <h3 className="job-card__title"><Link aria-label={`View ${job.title} at ${companyName}`} href={detailHref}>{job.title}</Link></h3>
        </div>
      </div>
      <div className="job-card__content">
        <div className="job-card__meta">
          {job.location ? <span>{job.location}</span> : null}
          {workMode ? <Badge variant="primary">{workMode}</Badge> : null}
          {employmentType ? <Badge>{employmentType}</Badge> : null}
          {experience ? <Badge>{experience}</Badge> : null}
        </div>
        {skills.length ? <p className="job-card__skills">{skills.map((skill) => skill.name).join(" · ")}</p> : null}
        {salary ? <p className="job-card__salary">{salary}</p> : null}
        {recommendation ? <RecommendationSummary recommendation={recommendation} /> : null}
      </div>
      <footer className="job-card__footer">
        <div className="job-card__dates">
          {published && publishedAt ? <time dateTime={publishedAt}>Published {published}</time> : null}
          {deadline && deadlineAt ? <time className={detailed && job.is_application_deadline_passed ? "job-card__deadline job-card__deadline--passed" : "job-card__deadline"} dateTime={deadlineAt}>{detailed && job.is_application_deadline_passed ? `Deadline passed ${deadline}` : `Deadline ${deadline}`}</time> : null}
        </div>
        <Link className="job-card__action" href={detailHref}>View opportunity <span aria-hidden="true">→</span></Link>
      </footer>
    </article>
  );
}
