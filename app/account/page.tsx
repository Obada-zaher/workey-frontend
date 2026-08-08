import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPanel } from "@/components/account/dashboard-panel";
import { AccountSectionHeading } from "@/components/account/account-section-heading";
import { ProfileProgressRing } from "@/components/account/profile-progress-ring";
import { CompanyCard } from "@/components/companies/company-card";
import { CompanyIdentity } from "@/components/jobs/company-identity";
import { RecommendedJobsCarousel } from "@/components/jobs/recommended-jobs-carousel";
import { AuthBackendError } from "@/lib/auth/backend";
import { getAccountHome } from "@/lib/account/server";
import type { HomeAction, JobSeekerHomeData } from "@/lib/auth/types";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Home | Workey" };

function targetHref(item: HomeAction | null) {
  return item?.target?.type === "profile_section" ? routes.profile : null;
}

function publishedLabel(value: string | null) {
  return value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value))
    : null;
}

function actionDateLabel(value: string | null | undefined) {
  return value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : null;
}

function AccountHome({ home }: { home: JobSeekerHomeData }) {
  const completeness = home.profile_completeness;
  const requiredAction = home.required_action?.type === "profile_incomplete" ? null : home.required_action;
  const actionHref = targetHref(requiredAction);
  const actionDate = requiredAction?.date_time ?? requiredAction?.deadline ?? null;
  const actionDateText = actionDateLabel(actionDate);
  const recommendationsAvailable =
    home.meta?.recommendations_available ?? home.meta?.recommendations?.available ?? true;

  return (
    <div className="account-home" dir="ltr" lang="en">
      <section className="account-home__top account-home__reveal" aria-label="Profile progress and current action">
        <DashboardPanel className="account-progress">
          <ProfileProgressRing percentage={completeness.percentage} />
          <div className="account-progress__content">
            <h1 className="type-heading-3 text-text-primary">Profile {completeness.percentage}% complete</h1>
            <p className="type-body-small text-text-secondary">
              {completeness.is_complete
                ? "Your profile is ready for new opportunities."
                : "Add a few more details to improve recommendations."}
            </p>
            <Link className="ui-button ui-button--primary account-progress__action" href={routes.profile}>
              Complete profile
            </Link>
          </div>
        </DashboardPanel>

        {requiredAction ? (
          <DashboardPanel className="account-action account-action--required">
            <p className="account-action__eyebrow">ACTION NEEDED</p>
            {requiredAction.title ? <h2 className="type-heading-2">{requiredAction.title}</h2> : null}
            {requiredAction.subtitle ? <p className="type-body">{requiredAction.subtitle}</p> : null}
            {actionDateText ? <time className="type-body-small" dateTime={actionDate ?? undefined}>{actionDateText}</time> : null}
            {actionHref && requiredAction.action_label ? (
              <Link className="ui-button ui-button--inverse" href={actionHref}>{requiredAction.action_label}</Link>
            ) : null}
            {!actionHref && requiredAction.action_label ? (
              <p className="type-body-small font-semibold">{requiredAction.action_label}</p>
            ) : null}
          </DashboardPanel>
        ) : (
          <DashboardPanel className="account-action account-action--discovery">
            <p className="account-action__eyebrow">DISCOVER OPPORTUNITIES</p>
            <h2 className="type-heading-2">Discover opportunities selected for your profile.</h2>
            <Link className="ui-button ui-button--inverse" href={routes.explore}>Explore opportunities</Link>
          </DashboardPanel>
        )}
      </section>

      <section className="account-home__section account-home__reveal">
        <AccountSectionHeading
          action={<Link className="account-home__view-all" href={routes.explore}>View all</Link>}
          title="Recommended Jobs"
        />
        {home.recommended_jobs.length ? (
          <div className="account-home__section-content">
            <RecommendedJobsCarousel jobs={home.recommended_jobs} />
          </div>
        ) : (
          <div className="account-home__empty-state">
            <p className="type-body text-text-secondary">
              {recommendationsAvailable
                ? "No job recommendations are available for your profile yet."
                : "Recommendations are temporarily unavailable. You can still browse all current jobs."}
            </p>
          </div>
        )}
      </section>

      <div className="account-home__bottom account-home__reveal">
        <DashboardPanel className="account-home__panel account-home__panel--latest">
          <AccountSectionHeading
            action={<Link className="account-home__view-all" href={routes.explore}>View all</Link>}
            title="Latest Jobs"
          />
          {home.latest_jobs.length ? (
            <div className="account-home__latest-list">
              {home.latest_jobs.slice(0, 4).map((job) => {
                const date = publishedLabel(job.published_at);

                return (
                  <Link className="account-home__latest-item" href={`${routes.explore}/${job.id}`} key={job.id}>
                    <CompanyIdentity logoUrl={job.company.logo_url} name={job.company.name ?? "Company"} size="small" />
                    <span className="account-home__latest-main">
                      <strong>{job.title}</strong>
                      <span>
                        {job.company.name ?? "Company"}
                        {job.location ? <> {"\u00b7"} {job.location}</> : null}
                      </span>
                    </span>
                    <span className="account-home__latest-meta">
                      <span className="ui-badge ui-badge--neutral">{job.employment_type.value}</span>
                      {date ? <time dateTime={job.published_at ?? undefined}>{date}</time> : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="type-body mt-4 text-text-secondary">No latest jobs are available right now.</p>
          )}
        </DashboardPanel>

        <DashboardPanel className="account-home__panel account-home__panel--companies">
          <AccountSectionHeading title="Featured Companies" />
          {home.featured_companies.length ? (
            <div className="account-home__company-grid">
              {home.featured_companies.slice(0, 6).map((company) => (
                <CompanyCard company={company} key={company.id} variant="mini" />
              ))}
            </div>
          ) : (
            <p className="type-body mt-4 text-text-secondary">No featured companies are available right now.</p>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

export default async function HomePage() {
  let home: JobSeekerHomeData | null = null;
  let loadError: unknown = null;

  try {
    home = await getAccountHome();
  } catch (error) {
    loadError = error;
  }

  if (!home) {
    const message =
      loadError instanceof AuthBackendError && loadError.status === 403
        ? "This area is only available to job seekers."
        : "Home information is temporarily unavailable. Please try again shortly.";

    return (
      <div className="max-w-3xl">
        <h1 className="type-heading-1 text-text-primary">Home</h1>
        <p className="radius-medium mt-5 border border-border-danger bg-danger-surface p-4 type-body text-danger" role="alert">
          {message}
        </p>
      </div>
    );
  }

  return <AccountHome home={home} />;
}
