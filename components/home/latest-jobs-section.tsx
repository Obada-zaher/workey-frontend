import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { SectionState } from "@/components/feedback/section-state";
import { JobCard } from "@/components/jobs/job-card";
import type { HomeJob } from "@/lib/api/types";

export function LatestJobsSection({ jobs, unavailable = false }: { jobs: HomeJob[]; unavailable?: boolean }) { return <Section id="latest-jobs"><SectionHeading eyebrow="JUST PUBLISHED" title="Latest opportunities" description="Fresh public roles from approved companies." action={<Link className="type-body-small font-semibold" href="/explore">Explore opportunities</Link>} /> <div className="mt-8">{unavailable ? <SectionState title="Opportunities are temporarily unavailable" description="Please try again shortly while we reconnect to Workey." /> : jobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{jobs.map((job) => <JobCard job={job} key={job.id} />)}</div> : <SectionState title="No current opportunities" description="New public roles will appear here as they are published." />}</div></Section>; }
