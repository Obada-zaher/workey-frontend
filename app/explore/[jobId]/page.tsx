import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AuthenticatedHeader } from "@/components/navigation/authenticated-header";
import { AuthenticatedMobileNavigation } from "@/components/navigation/authenticated-mobile-navigation";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPublicJob } from "@/lib/api/jobs";
import { ApiError } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/auth/server";
import { routes } from "@/config/routes";

export default async function ExploreJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await getCurrentUser();
  let job;

  try {
    job = await getPublicJob(jobId);
  } catch (error) {
    if (error instanceof ApiError && error.code === "not_found") notFound();

    return (
      <div className={user ? "account-app-shell min-h-dvh bg-background" : undefined}>
        {user ? <AuthenticatedHeader user={user} /> : <PublicHeader />}
        <main className={user ? "account-main" : "layout-container py-16"}>
          <p className="type-heading-2 text-text-primary">This opportunity is temporarily unavailable.</p>
          <Link className="type-body mt-4 inline-block" href={routes.explore}>Return to Explore</Link>
        </main>
        {user ? <AuthenticatedMobileNavigation /> : <PublicFooter />}
      </div>
    );
  }

  return (
    <div className={user ? "account-app-shell min-h-dvh bg-background" : undefined}>
      {user ? <AuthenticatedHeader user={user} /> : <PublicHeader />}
      <main className={user ? "account-main" : "layout-container py-12 lg:py-16"} id="main-content">
        <Link className="type-body-small" href={routes.explore}>← Explore opportunities</Link>
        <article className="content-form mt-6 max-w-3xl">
          <p className="type-body-small font-semibold text-secondary">{job.company?.name ?? "Company"}</p>
          <h1 className="type-display mt-3 text-text-primary">{job.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="primary">{job.work_mode.value}</Badge>
            <Badge>{job.employment_type.value}</Badge>
            {job.experience_level ? <Badge>{job.experience_level.value}</Badge> : null}
          </div>
          {job.location ? <p className="type-body mt-5 text-text-secondary">{job.location}</p> : null}
          <section className="mt-10">
            <h2 className="type-heading-2 text-text-primary">About this opportunity</h2>
            <p className="type-body mt-4 whitespace-pre-line text-text-secondary">{job.description}</p>
          </section>
          {job.skills.length ? (
            <section className="mt-10">
              <h2 className="type-heading-2 text-text-primary">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => <Badge key={skill.id}>{skill.name}</Badge>)}
              </div>
            </section>
          ) : null}
          {!user ? (
            <div className="mt-12">
              <Link className="ui-button ui-button--primary" href={routes.register}>Create an account to apply</Link>
            </div>
          ) : null}
        </article>
      </main>
      {user ? <AuthenticatedMobileNavigation /> : <PublicFooter />}
    </div>
  );
}
