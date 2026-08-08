import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { JobApplicationDetails } from "@/lib/applications/types";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };
function invalidId(value: string) { return !/^\d+$/.test(value); }
function failure(error: unknown) { const backend = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Application details are temporarily unavailable."); const response = NextResponse.json({ message: backend.status === 401 ? "Your session has ended. Please log in again." : backend.message }, { status: backend.status, headers }); if (backend.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }

export async function GET(request: NextRequest, context: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await context.params; const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return failure(new AuthBackendError(401, "Your session has ended.")); if (invalidId(applicationId)) return NextResponse.json({ message: "Application not found." }, { status: 404, headers });
  try { return NextResponse.json({ data: await authBackendRequest<JobApplicationDetails>(`applications/${applicationId}`, { method: "GET", token, language: request.headers.get("accept-language") ?? undefined }) }, { headers }); } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest, context: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await context.params; const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return failure(new AuthBackendError(401, "Your session has ended.")); if (invalidId(applicationId)) return NextResponse.json({ message: "Application not found." }, { status: 404, headers });
  let note: string | null = null; try { const body: unknown = await request.json(); if (body && typeof body === "object" && "note" in body && typeof body.note === "string") note = body.note.trim() || null; } catch { return NextResponse.json({ message: "Invalid withdrawal request." }, { status: 400, headers }); }
  try { return NextResponse.json({ data: await authBackendRequest<JobApplicationDetails>(`applications/${applicationId}/withdraw`, { method: "POST", token, body: { note }, language: request.headers.get("accept-language") ?? undefined }) }, { headers }); } catch (error) { return failure(error); }
}
