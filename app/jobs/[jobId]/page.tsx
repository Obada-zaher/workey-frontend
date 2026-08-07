import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CompanyIdentity } from "@/components/jobs/company-identity";
import { JobDetailHeader } from "@/components/jobs/job-detail-header";
import { JobDetailBackLink } from "@/components/jobs/job-detail-back-link";
import { Container } from "@/components/layout/container";
import { AuthenticatedHeader } from "@/components/navigation/authenticated-header";
import { AuthenticatedMobileNavigation } from "@/components/navigation/authenticated-mobile-navigation";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPublicJob } from "@/lib/api/jobs";
import { ApiError } from "@/lib/api/errors";
import type { Job, Skill } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/server";
import { routes } from "@/config/routes";

interface JobPageProps { params: Promise<{ jobId: string }>; }

function validJobId(jobId: string) {
  return /^[1-9]\d*$/.test(jobId);
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validJob(value: unknown): value is Job {
  return record(value)
    && typeof value.id === "number"
    && typeof value.title === "string"
    && value.title.trim().length > 0
    && typeof value.description === "string"
    && record(value.work_mode)
    && typeof value.work_mode.value === "string"
    && record(value.employment_type)
    && typeof value.employment_type.value === "string";
}

function validDate(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function formatDate(value: unknown): string | null {
  const date = validDate(value);
  return date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : null;
}

function label(value: unknown): string | null {
  return value && typeof value === "object" && "value" in value && typeof value.value === "string" && value.value.trim() ? value.value : null;
}

function skillsFrom(value: unknown): Skill[] {
  const seen = new Set<number>();
  return Array.isArray(value) ? value.filter((skill): skill is Skill => {
    if (!skill || typeof skill !== "object" || typeof (skill as Skill).id !== "number" || typeof (skill as Skill).name !== "string") return false;
    if (seen.has((skill as Skill).id)) return false;
    seen.add((skill as Skill).id);
    return true;
  }) : [];
}

function companyName(job: Job) {
  return typeof job.company?.name === "string" && job.company.name.trim() ? job.company.name : "Company";
}

function JobPageShell({ children, user }: { children: ReactNode; user: Awaited<ReturnType<typeof getCurrentUser>> }) {
  return <div className={user ? "account-app-shell min-h-dvh bg-background" : "min-h-dvh bg-background"}>{user ? <AuthenticatedHeader user={user} /> : <PublicHeader />}{children}{user ? <AuthenticatedMobileNavigation /> : <PublicFooter />}</div>;
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { jobId } = await params;
  if (!validJobId(jobId)) return { title: "Job Opportunity | Workey" };
  try {
    const job = await getPublicJob(jobId);
    if (!validJob(job)) return { title: "Job Opportunity | Workey" };
    return {
      title: `${job.title} at ${companyName(job)} | Workey`,
      description: `Explore the ${job.title} opportunity at ${companyName(job)} on Workey.`,
    };
  } catch {
    return { title: "Job Opportunity | Workey" };
  }
}

export function JobHeader({ job }: { job: Job }) {
  const company = companyName(job);
  const logoUrl = typeof job.company?.logo_url === "string" ? job.company.logo_url : null;
  const workMode = label(job.work_mode);
  const employmentType = label(job.employment_type);
  const experience = label(job.experience_level);
  const published = formatDate(job.published_at);
  const deadline = formatDate(job.application_deadline);

  return <header className="job-detail__header"><div className="job-detail__identity"><CompanyIdentity logoUrl={logoUrl} name={company} /><div><p className="job-detail__company">{company}</p><h1>{job.title}</h1></div></div><div className="job-detail__header-meta">{job.location ? <span>{job.location}</span> : null}{workMode ? <Badge variant="primary">{workMode}</Badge> : null}{employmentType ? <Badge>{employmentType}</Badge> : null}{experience ? <Badge>{experience}</Badge> : null}</div>{published || deadline ? <p className="job-detail__published">{published ? `Published ${published}` : null}{published && deadline ? " · " : null}{deadline ? `Deadline ${deadline}` : null}</p> : null}</header>;
}

function JobOverview({ job }: { job: Job }) {
  const values = [
    ["Department", job.department],
    ["Employment type", label(job.employment_type)],
    ["Experience", label(job.experience_level)],
    ["Work mode", label(job.work_mode)],
    ["Location", job.location],
    ["Published", formatDate(job.published_at)],
    ["Application deadline", formatDate(job.application_deadline)],
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);
  if (!values.length) return null;
  return <section className="job-detail__section"><h2>Job overview</h2><dl className="job-detail__overview">{values.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></section>;
}

function ApplicationPanel({ job }: { job: Job }) {
  const deadline = formatDate(job.application_deadline);
  const deadlinePassed = job.is_application_deadline_passed;
  const accepting = job.is_accepting_applications && job.can_apply && !deadlinePassed;
  const status = deadlinePassed ? "Deadline passed" : accepting ? "Accepting applications" : "Applications closed";
  return <section className="job-detail__panel job-detail__application"><p className="job-detail__eyebrow">APPLICATION STATUS</p><h2>{status}</h2><p>{accepting ? "Application availability is confirmed for this opportunity." : "This opportunity is not currently accepting applications."}</p>{job.has_application_deadline && deadline ? <p className={deadlinePassed ? "job-detail__deadline job-detail__deadline--passed" : "job-detail__deadline"}>Application deadline: {deadline}</p> : null}</section>;
}

function CompanyPanel({ job }: { job: Job }) {
  const company = job.company;
  if (!company) return null;
  const name = companyName(job);
  return <section className="job-detail__panel"><div className="job-detail__company-heading"><CompanyIdentity logoUrl={company.logo_url} name={name} size="large" /><div><p className="job-detail__eyebrow">COMPANY</p><h2>{name}</h2></div></div>{company.industry ? <p><strong>Industry:</strong> {company.industry}</p> : null}{company.location ? <p><strong>Location:</strong> {company.location}</p> : null}</section>;
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { jobId } = await params;
  if (!validJobId(jobId)) notFound();
  const user = await getCurrentUser();
  let job: Job;

  try {
    job = await getPublicJob(jobId);
    if (!validJob(job)) throw new ApiError("Job response was invalid.", "invalid_json");
  } catch (error) {
    if (error instanceof ApiError && error.code === "not_found") notFound();
    return <JobPageShell user={user}><main className={user ? "account-main" : "layout-section"}><Container><section className="job-detail__state ui-card ui-card--muted"><h1>We could not load this opportunity right now.</h1><p>Please try again shortly.</p><div><Link className="ui-button ui-button--outline" href={`/jobs/${jobId}`}>Retry</Link><Link className="ui-button ui-button--primary" href={routes.explore}>Explore other opportunities</Link></div></section></Container></main></JobPageShell>;
  }

  const skills = skillsFrom(job.skills);
  const description = typeof job.description === "string" && job.description.trim() ? job.description.trim().split(/\n\s*\n/) : [];

  return <JobPageShell user={user}>
    <main className={user ? "account-main" : "layout-section"} id="main-content">
      <Container>
        <div className="job-detail__navigation"><JobDetailBackLink /><Link href={routes.explore}>Back to Explore</Link></div>
        <JobDetailHeader job={job} />
        <div className="job-detail__layout">
          <article className="job-detail__main">
            <JobOverview job={job} />
            {description.length ? <section className="job-detail__section"><h2>About this opportunity</h2><div className="job-detail__description">{description.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section> : null}
            {skills.length ? <section className="job-detail__section"><h2>Skills</h2><div className="job-detail__skills">{skills.map((skill) => <Badge key={skill.id}>{skill.name}</Badge>)}</div></section> : null}
          </article>
          <aside className="job-detail__sidebar"><ApplicationPanel job={job} /><CompanyPanel job={job} /></aside>
        </div>
      </Container>
    </main>
  </JobPageShell>;
}
