import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import type { HomeJob, Job } from "@/lib/api/types";

function formatDate(value: string | null): string | null {
  return value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
    : null;
}

function isDetailedJob(job: HomeJob | Job): job is Job {
  return "skills" in job;
}

export function JobCard({
  job,
  variant = "default",
}: {
  job: HomeJob | Job;
  variant?: "default" | "compact";
}) {
  const detailed = isDetailedJob(job);
  const companyName = job.company?.name ?? "Company";
  const date = formatDate(job.published_at);

  return (
    <article className={`job-card ui-card ui-card--interactive flex h-full flex-col${variant === "compact" ? " job-card--compact" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div aria-hidden="true" className="radius-medium flex size-11 shrink-0 items-center justify-center bg-accent font-semibold text-accent-foreground">
          {companyName.slice(0, 2).toUpperCase()}
        </div>
        <Badge variant="primary">{job.work_mode.value}</Badge>
      </div>
      <h3 className="type-heading-3 mt-5 text-text-primary">
        <Link className="text-inherit no-underline" href={`${routes.explore}/${job.id}`}>
          {job.title}
        </Link>
      </h3>
      <p className="type-body-small mt-2 font-medium text-text-secondary">{companyName}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{job.employment_type.value}</Badge>
        {detailed && job.experience_level ? <Badge>{job.experience_level.value}</Badge> : null}
      </div>
      {detailed && job.skills.length ? (
        <p className="type-body-small mt-4 text-text-muted">
          {job.skills.slice(0, 3).map((skill) => skill.name).join(" \u00b7 ")}
        </p>
      ) : null}
      <div className="mt-auto pt-5 type-body-small text-text-muted">
        {job.location ? <p>{job.location}</p> : null}
        {date ? <time dateTime={job.published_at ?? undefined}>Published {date}</time> : null}
      </div>
      <Link className="type-body-small mt-5 font-semibold" href={`${routes.explore}/${job.id}`}>
        View opportunity
      </Link>
    </article>
  );
}
