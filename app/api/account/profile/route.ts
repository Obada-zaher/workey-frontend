import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { JobSeekerProfileDetail } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, private" };
const editableFields = ["name", "headline", "summary", "phone", "location", "city_id", "availability_status", "available_from", "portfolio_url", "linkedin_url", "github_url"] as const;
type EditableField = typeof editableFields[number];

function errorResponse(error: unknown) {
  const authError = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Profile information is temporarily unavailable.");
  const message = authError.status === 401 ? "Your session has ended. Please log in again." : authError.status === 403 ? "This account area is only available to job seekers." : authError.status >= 500 ? "Profile information is temporarily unavailable. Please try again shortly." : authError.message;
  const response = NextResponse.json({ message, code: authError.code, errors: authError.errors }, { status: authError.status, headers: noStore });
  if (authError.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}

async function tokenFor(request: NextRequest) { const token = request.cookies.get(sessionCookieName)?.value; if (!token) throw new AuthBackendError(401, "Your session has ended."); return token; }

export async function GET(request: NextRequest) {
  try { return NextResponse.json({ data: await authBackendRequest<JobSeekerProfileDetail>("profile", { method: "GET", token: await tokenFor(request), language: request.headers.get("accept-language") ?? undefined }) }, { headers: noStore }); } catch (error) { return errorResponse(error); }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Provide valid profile fields." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Provide valid profile fields." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !editableFields.includes(key as EditableField)) || Object.entries(input).some(([key, value]) => value !== null && typeof value !== "string" && !(key === "city_id" && typeof value === "number"))) return NextResponse.json({ message: "Provide valid profile fields." }, { status: 400, headers: noStore });
  const payload = Object.fromEntries(editableFields.flatMap((field) => field in input ? [[field, input[field] as string | number | null]] : []));
  if (!Object.keys(payload).length) return NextResponse.json({ message: "Choose at least one profile field to update." }, { status: 400, headers: noStore });
  try { return NextResponse.json({ data: await authBackendRequest<JobSeekerProfileDetail>("profile", { method: "PUT", token: await tokenFor(request), body: payload, language: request.headers.get("accept-language") ?? undefined }) }, { headers: noStore }); } catch (error) { return errorResponse(error); }
}
