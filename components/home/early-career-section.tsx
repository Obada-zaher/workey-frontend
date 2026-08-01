import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { JobCard } from "@/components/jobs/job-card";
import type { Job } from "@/lib/api/types";

export function EarlyCareerSection({ jobs }: { jobs: Job[] }) { return <Section surface="muted"><SectionHeading eyebrow="EARLY CAREER" title="Start your career" description="Internship opportunities returned by the public jobs API." action={<Link className="type-body-small font-semibold" href="/explore">Explore opportunities</Link>} /><div className="mt-8">{jobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{jobs.map((job) => <JobCard job={job} key={job.id} />)}</div> : <div className="ui-card"><p className="type-body text-text-secondary">Explore all current public opportunities to find the right next step.</p><Link className="type-body-small mt-3 inline-block font-semibold" href="/explore">Explore opportunities</Link></div>}</div></Section>; }
