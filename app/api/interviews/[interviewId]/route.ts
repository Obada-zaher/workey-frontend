import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { InterviewDetails } from "@/lib/interviews/types";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };
function validId(value: string) { return /^\d+$/.test(value) && Number(value) > 0; }
function failure(error: unknown) { const backend = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Interview details are temporarily unavailable."); const response = NextResponse.json({ message: backend.status === 401 ? "Your session has ended. Please log in again." : backend.message, code: backend.code, errors: backend.errors }, { status: backend.status, headers: noStore }); if (backend.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
export async function GET(request: NextRequest, context: { params: Promise<{ interviewId: string }> }) { const { interviewId } = await context.params; const token = request.cookies.get(sessionCookieName)?.value; if (!token) return failure(new AuthBackendError(401, "Your session has ended.")); if (!validId(interviewId)) return NextResponse.json({ message: "Interview not found." }, { status: 404, headers: noStore }); try { const data = await authBackendRequest<InterviewDetails>(`interviews/${interviewId}`, { method: "GET", token, language: request.headers.get("accept-language") ?? undefined }); return NextResponse.json({ data }, { headers: noStore }); } catch (error) { return failure(error); } }
