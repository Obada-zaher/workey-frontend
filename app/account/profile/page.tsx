import type { Metadata } from "next";
import { ProfileEditor } from "@/components/account/profile-editor";
import { ContextualBackButton } from "@/components/navigation/contextual-back-button";
import { getAccountProfile } from "@/lib/account/server";
import { AuthBackendError } from "@/lib/auth/backend";
import { requireJobSeeker } from "@/lib/auth/server";
import type { JobSeekerProfileDetail } from "@/lib/auth/types";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Profile | Workey" };

export default async function ProfilePage() {
  const user = await requireJobSeeker(routes.profile);
  let profile: JobSeekerProfileDetail | null = null;
  let loadError: unknown = null;
  try { profile = await getAccountProfile(); } catch (error) { loadError = error; }
  if (!profile) { const message = loadError instanceof AuthBackendError && loadError.status === 403 ? "This account area is only available to job seekers." : "Your profile information is temporarily unavailable. Please try again shortly."; return <div className="max-w-3xl"><ContextualBackButton fallback={routes.authenticatedHome} /><h1 className="type-heading-1 text-text-primary">Your profile</h1><p className="radius-medium mt-5 border border-border-danger bg-danger-surface p-4 type-body text-danger" role="alert">{message}</p></div>; }
  return <><ContextualBackButton fallback={routes.authenticatedHome} /><ProfileEditor initialProfile={profile} user={user} /></>;
}
