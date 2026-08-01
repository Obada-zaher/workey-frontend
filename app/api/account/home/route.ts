import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { JobSeekerHomeData } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, private" };

function errorResponse(error: unknown) {
  const authError = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Account information is temporarily unavailable.");
  const message = authError.status === 401 ? "Your session has ended. Please log in again." : authError.status === 403 ? "This account area is only available to job seekers." : authError.status >= 500 ? "Account information is temporarily unavailable. Please try again shortly." : authError.message;
  const response = NextResponse.json({ message, code: authError.code, errors: authError.errors }, { status: authError.status, headers: noStore });
  if (authError.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return errorResponse(new AuthBackendError(401, "Your session has ended."));
  try { return NextResponse.json({ data: await authBackendRequest<JobSeekerHomeData>("home", { method: "GET", token, language: request.headers.get("accept-language") ?? undefined }) }, { headers: noStore }); } catch (error) { return errorResponse(error); }
}
