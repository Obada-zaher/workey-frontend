import type { Metadata } from "next";
import { AuthenticatedHeader } from "@/components/navigation/authenticated-header";
import { AuthenticatedMobileNavigation } from "@/components/navigation/authenticated-mobile-navigation";
import { JobsExplorer, type ExploreSchemaStatus } from "@/components/jobs/jobs-explorer";
import { Container } from "@/components/layout/container";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { ApiError } from "@/lib/api/errors";
import { getJobFilterSchema } from "@/lib/api/jobs";
import { getCurrentUser } from "@/lib/auth/server";
import { normalizeExploreTab } from "@/lib/jobs/explore-state";
import { getRecommendedJobs } from "@/lib/jobs/recommended-server";

export const metadata: Metadata = {
  title: "Explore | Workey",
  description: "Search current opportunities on Workey.",
};

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
function recommendationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "unauthorized" || error.code === "forbidden") return "Your session has expired. Please sign in again to refresh recommendations.";
    if (error.code === "network" || error.code === "server" || error.code === "service_unavailable") return "Recommendations are temporarily unavailable. Please try again shortly.";
  }
  return "Recommendations are temporarily unavailable.";
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const authenticated = Boolean(user);
  const activeTab = normalizeExploreTab(first(params.tab), authenticated);
  let schema = null;
  let schemaStatus: ExploreSchemaStatus = "ready";
  let schemaError: string | null = null;

  try {
    schema = await getJobFilterSchema();
    if (!schema) schemaStatus = "unsupported";
  } catch (error) {
    schemaStatus = "failed";
    schemaError = error instanceof ApiError ? error.message : "Filters are temporarily unavailable.";
  }

  let recommendations = null;
  let recommendationsError: string | null = null;
  if (authenticated && activeTab === "for-you") {
    try {
      recommendations = await getRecommendedJobs();
    } catch (error) {
      recommendationsError = recommendationErrorMessage(error);
    }
  }

  return (
    <div className={authenticated ? "account-app-shell min-h-dvh bg-background" : undefined}>
      <a className="skip-link" href="#explore-results">Skip to opportunities</a>
      {user ? <AuthenticatedHeader user={user} /> : <PublicHeader />}
      <main className={authenticated ? "account-main" : "layout-section layout-section--compact"} id="main-content">
        <Container>
          <JobsExplorer
            authenticated={authenticated}
            initialRecommendations={recommendations}
            initialRecommendationsError={recommendationsError}
            initialSchema={schema}
            initialSchemaError={schemaError}
            initialSchemaStatus={schemaStatus}
          />
        </Container>
      </main>
      {user ? <AuthenticatedMobileNavigation /> : <PublicFooter />}
    </div>
  );
}
