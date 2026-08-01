"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { JobSearchForm } from "./job-search-form";
import { JobCard } from "@/components/jobs/job-card";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import type { GuestHero, HomeJob } from "@/lib/api/types";

interface HomeJobDiscoveryProps { hero?: GuestHero; heroJobs: HomeJob[]; }

export function HomeJobDiscovery({ hero, heroJobs }: HomeJobDiscoveryProps) {
  const router = useRouter();
  return <><section className="hero-surface"><div className="layout-container grid gap-10 py-12 lg:grid-cols-[1fr_.9fr] lg:py-20"><div className="home-reveal relative flex flex-col justify-center"><p className="type-body-small font-semibold tracking-wide text-secondary">CAREER DISCOVERY, MADE CLEARER</p><h1 className="type-display mt-5 text-text-primary">{hero?.title ?? "Discover work that moves you forward"}</h1><p className="content-form type-body-large mt-5 text-text-secondary">{hero?.description ?? "Explore public opportunities and start building a clearer professional path with Workey."}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button className="w-full sm:w-auto" onClick={() => router.push("/register")} type="button">Create account</Button><Button className="w-full sm:w-auto" onClick={() => router.push("/login")} type="button" variant="outline">Log in</Button></div><Link className="type-body-small mt-5 w-fit font-semibold text-text-secondary" href="#jobs-results">Browse jobs</Link></div><div aria-hidden="true" className="hero-visual home-reveal home-reveal--delayed p-6"><span className="hero-orb hero-orb--one" /><span className="hero-orb hero-orb--two" /><div className="surface-glass radius-large relative mt-10 p-5"><p className="type-body-small font-semibold text-text-primary">A better starting point</p><p className="type-body-small mt-2 text-text-secondary">Build your profile, manage your CV, and discover roles that fit your next step.</p></div><div className="radius-large elevation-card absolute inset-x-6 bottom-6 border border-border-default bg-surface p-5"><p className="type-heading-3 text-text-primary">Discover opportunities</p><div className="mt-4 flex flex-wrap gap-2"><span className="ui-badge ui-badge--primary">Skills</span><span className="ui-badge ui-badge--neutral">Career goals</span><span className="ui-badge ui-badge--information">Progress</span></div></div></div></div></section><Section id="jobs-results"><SectionHeading description="Search by role, company, skill, location, or work mode. Results open on the dedicated jobs page." eyebrow="OPPORTUNITIES" title="Find your next opportunity" /><div className="radius-large mt-7 border border-border-default bg-surface p-5"><JobSearchForm /></div><div className="mt-8"><SectionHeading description="A small selection of the latest approved public roles." eyebrow="JUST PUBLISHED" title="Latest opportunities" /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{heroJobs.map((job) => <JobCard job={job} key={job.id} />)}</div></Section></>;
}
