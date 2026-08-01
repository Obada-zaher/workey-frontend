import "server-only";
import { redirect } from "next/navigation";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { getSessionToken } from "@/lib/auth/server";
import type { JobSeekerHomeData, JobSeekerProfileDetail } from "@/lib/auth/types";

async function tokenFor(returnTo: string) { const token = await getSessionToken(); if (!token) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`); return token; }

export async function getAccountHome() {
  const token = await tokenFor("/account");
  try { return await authBackendRequest<JobSeekerHomeData>("home", { method: "GET", token }); } catch (error) { if (error instanceof AuthBackendError && error.status === 401) redirect("/login?returnTo=/account"); throw error; }
}

export async function getAccountProfile() {
  const token = await tokenFor("/account/profile");
  try { return await authBackendRequest<JobSeekerProfileDetail>("profile", { method: "GET", token }); } catch (error) { if (error instanceof AuthBackendError && error.status === 401) redirect("/login?returnTo=/account/profile"); throw error; }
}
