import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { getSessionToken } from "@/lib/auth/server";
import type { InterviewDetails } from "./types";

export async function getInterviewDetails(interviewId: number) {
  const token = await getSessionToken();
  if (!token) redirect(`/login?returnTo=${encodeURIComponent(`/interviews/${interviewId}`)}`);
  const language = (await headers()).get("accept-language") ?? undefined;
  return authBackendRequest<InterviewDetails>(`interviews/${interviewId}`, { method: "GET", token, language });
}
export { AuthBackendError };
