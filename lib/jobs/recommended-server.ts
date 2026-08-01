import "server-only";

import { authBackendRequest, isJobSeeker } from "@/lib/auth/backend";
import { getSessionToken } from "@/lib/auth/server";
import type { JobRecommendation } from "@/lib/api/types";
import type { AuthenticatedUser } from "@/lib/auth/types";

/**
 * Returns recommendations only for a verified job-seeker session. Guests and
 * unsupported roles receive null, so callers never need to expose a token to
 * client-side Explore code.
 */
export async function getRecommendedJobs(limit = 20, language = "en"): Promise<JobRecommendation[] | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const user = await authBackendRequest<AuthenticatedUser>("auth/me", { method: "GET", token, language });
  if (!isJobSeeker(user)) return null;

  return authBackendRequest<JobRecommendation[]>("jobs/recommended", {
    method: "GET",
    token,
    language,
    query: { limit },
  });
}
