import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { JobApplicationSummary } from "@/lib/applications/types";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };

function failure(error: unknown) {
  const backend = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Applications are temporarily unavailable.");
  const response = NextResponse.json({ message: backend.status === 401 ? "Your session has ended. Please log in again." : backend.message }, { status: backend.status, headers });
  if (backend.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return failure(new AuthBackendError(401, "Your session has ended."));
  const perPage = Number(request.nextUrl.searchParams.get("per_page"));
  try {
    const data = await authBackendRequest<JobApplicationSummary[] | { data?: JobApplicationSummary[]; meta?: unknown }>("applications/my", { method: "GET", token, language: request.headers.get("accept-language") ?? undefined, query: Number.isInteger(perPage) && perPage > 0 ? { per_page: Math.min(perPage, 100) } : undefined });
    return NextResponse.json({ data }, { headers });
  } catch (error) { return failure(error); }
}
